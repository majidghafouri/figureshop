import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/db";
import { Locale } from "@/lib/i18n";
import { notifySubscribersOfNewPost } from "@/lib/newsletter";
import RssParser from "rss-parser";

const UA = "FigureforgeBot/1.0 (+https://figurforgj.com)";
const MAX_BODY_CHARS = 7000;
const MAX_ARTICLES_PER_RUN = 2;

const parser = new RssParser({
  timeout: 15_000,
  headers: { "User-Agent": UA },
});

export type WebArticleCandidate = {
  url: string;
  title?: string;
  snippet?: string;
  image?: string;
  sourceName?: string;
  topic?: string;
};

// ---------- Discovery ----------

const SEARCH_QUERIES: { query: string; topic: string }[] = [
  { query: "3D printing anime figures resin guide 2026", topic: "printing" },
  { query: "best anime figure collecting tips beginners", topic: "collecting" },
  { query: "how to paint 3D printed resin miniatures", topic: "painting" },
  { query: "resin 3D printer settings anime figures detailed", topic: "printing" },
  { query: "anime figure care display cleaning guide", topic: "collecting" },
  { query: "SLA resin printing tips miniatures high detail", topic: "printing" },
  { query: "scale figure collecting 2026 recommended", topic: "collecting" },
];

const FALLBACK_FEEDS = [
  { url: "https://all3dp.com/feed/", name: "All3DP", topic: "printing" },
  { url: "https://3dprintingindustry.com/feed/", name: "3D Printing Industry", topic: "printing" },
  { url: "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us", name: "Anime News Network", topic: "collecting" },
  { url: "https://blog.teacherspayteachers.com/feed/", name: "Miniatures Blog", topic: "painting" },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function discoverViaSerpApi(): Promise<WebArticleCandidate[]> {
  const API_KEY = process.env.SERPAPI_KEY || process.env.SERP_API_KEY;
  if (!API_KEY) return [];

  const candidates: WebArticleCandidate[] = [];

  try {
    const { query, topic } = pickRandom(SEARCH_QUERIES);
    const res = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=8&hl=en&api_key=${API_KEY}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: Array<{
      title?: string;
      snippet?: string;
      link?: string;
      thumbnail?: string;
    }> = data.organic_results || [];

    for (const r of results) {
      if (r.link && r.title && !r.link.includes("youtube.com") && !r.link.includes("reddit.com")) {
        candidates.push({
          url: r.link,
          title: r.title,
          snippet: r.snippet,
          image: r.thumbnail,
          topic,
        });
      }
    }
  } catch {
    // serpapi failed silently
  }

  return candidates;
}

async function discoverViaRss(): Promise<WebArticleCandidate[]> {
  const candidates: WebArticleCandidate[] = [];

  for (const feed of FALLBACK_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items.slice(0, 5)) {
        if (!item.title || !item.link) continue;
        const image =
          item.enclosure?.url ||
          item.content?.match(/<img[^>]+src="([^"]+)"/)?.[1] ||
          null;
        candidates.push({
          url: item.link,
          title: item.title,
          snippet: item.contentSnippet?.slice(0, 500),
          image: image ?? undefined,
          sourceName: parsed.title || feed.name,
          topic: feed.topic,
        });
      }
    } catch {
      // feed failed — continue with others
    }
  }

  return candidates;
}

export async function discoverCandidates(): Promise<WebArticleCandidate[]> {
  const serpCandidates = await discoverViaSerpApi();
  if (serpCandidates.length > 0) return serpCandidates;
  return discoverViaRss();
}

// ---------- Scraping ----------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#\d+;/g, (m) => {
      const code = parseInt(m.slice(2, -1), 10);
      return String.fromCharCode(code);
    });
}

function absUrl(href: string, base: string): string {
  if (!href) return "";
  if (href.startsWith("data:")) return href;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function inlineToMarkdown(html: string, baseUrl: string): string {
  let text = html;

  // preserve <a href> links
  text = text.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const url = absUrl(href, baseUrl);
    const content = stripTags(decodeEntities(inner)).trim();
    return content ? `[${content}](${url})` : "";
  });

  // preserve <strong>/<b>
  text = text.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _tag, inner) => {
    return `**${stripTags(decodeEntities(inner)).trim()}**`;
  });

  // strip remaining tags
  text = stripTags(text);
  text = decodeEntities(text);
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractContentBlocks(html: string, baseUrl: string): string {
  // Remove noise
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find <article> content
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) cleaned = articleMatch[1];
  else {
    const mainMatch = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) cleaned = mainMatch[1];
  }

  const lines: string[] = [];
  const seen = new Set<string>();

  // Process headings
  cleaned.replace(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, inner) => {
    const text = inlineToMarkdown(inner, baseUrl);
    if (text && !seen.has(text)) {
      seen.add(text);
      lines.push("");
      lines.push(`${"#".repeat(parseInt(level))} ${text}`);
      lines.push("");
    }
    return "";
  });

  // Process blockquotes
  cleaned.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const text = stripTags(decodeEntities(inner)).replace(/\s+/g, " ").trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      lines.push("");
      lines.push(`> ${text}`);
      lines.push("");
    }
    return "";
  });

  // Process lists
  cleaned.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _type, listContent) => {
    const items: string[] = [];
    listContent.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_lm: string, liInner: string) => {
      const text = inlineToMarkdown(liInner, baseUrl);
      if (text && !seen.has(text)) {
        seen.add(text);
        items.push(`- ${text}`);
      }
      return "";
    });
    if (items.length > 0) {
      lines.push("");
      items.forEach((item) => lines.push(item));
      lines.push("");
    }
    return "";
  });

  // Process images standalone
  cleaned.replace(/<img\b([^>]*)>/gi, (_m, attrs) => {
    const srcMatch = attrs.match(/src="([^"]*)"/i);
    const altMatch = attrs.match(/alt="([^"]*)"/i);
    if (srcMatch?.[1]) {
      const src = absUrl(srcMatch[1], baseUrl);
      const alt = altMatch?.[1] ? decodeEntities(altMatch[1]).trim() : "";
      if (src && !src.startsWith("data:") && !seen.has(src)) {
        seen.add(src);
        lines.push("");
        lines.push(`![${alt}](${src})`);
        lines.push("");
      }
    }
    return "";
  });

  // Process paragraphs
  cleaned.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    const text = inlineToMarkdown(inner, baseUrl);
    if (text && text.length > 20 && !seen.has(text)) {
      seen.add(text);
      lines.push("");
      lines.push(text);
      lines.push("");
    }
    return "";
  });

  // Fallback: process remaining text blocks
  if (lines.length < 3) {
    const remaining = stripTags(cleaned);
    const words = remaining.split(/\s+/);
    for (let i = 0; i < Math.min(words.length, 1500); i += 30) {
      const chunk = words.slice(i, i + 30).join(" ").trim();
      if (chunk.length > 20 && !seen.has(chunk)) {
        seen.add(chunk);
        lines.push("");
        lines.push(chunk);
        lines.push("");
      }
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractMeta(html: string): {
  title: string | null;
  image: string | null;
  siteName: string | null;
  description: string | null;
} {
  const getMeta = (prop: string): string | null => {
    // property="..." or name="..."
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
    const match = html.match(regex);
    if (match?.[1]) return decodeEntities(match[1]).trim();
    // content="..." ... property="..."
    const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
    const match2 = html.match(regex2);
    return match2?.[1] ? decodeEntities(match2[1]).trim() : null;
  };

  return {
    title: getMeta("og:title") || getMeta("twitter:title"),
    image: getMeta("og:image") || getMeta("twitter:image"),
    siteName: getMeta("og:site_name"),
    description: getMeta("og:description") || getMeta("description"),
  };
}

function normalizeImgUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function removeCoverImage(markdown: string, imageUrl: string | null): string {
  if (!imageUrl) return markdown;
  const coverNorm = normalizeImgUrl(imageUrl);
  const cleaned = markdown
    .split("\n")
    .filter((line) => {
      const m = line.trim().match(/^!\[[^\]]*\]\(([^)\s]+)\)$/);
      return !(m && normalizeImgUrl(m[1]) === coverNorm);
    })
    .join("\n");
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

export async function scrapeArticle(
  url: string,
): Promise<{
  title: string;
  siteName: string | null;
  image: string | null;
  description: string | null;
  markdown: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const meta = extractMeta(html);
    const markdown = extractContentBlocks(html, url);
    const image = meta.image ? absUrl(meta.image, url) : null;

    return {
      title: meta.title || stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") || "Untitled",
      siteName: meta.siteName || new URL(url).hostname.replace(/^www\./, ""),
      image,
      description: meta.description?.slice(0, 500) || null,
      markdown: removeCoverImage(markdown, image).slice(0, MAX_BODY_CHARS),
    };
  } catch {
    return null;
  }
}

// ---------- Translation ----------

const TRANSLATE_HOSTS = [
  "https://translate.googleapis.com/translate_a/single",
  "https://clients5.google.com/translate_a/single",
];

// The plain client=gtx endpoint gets persistent fingerprint-based 429s when
// called from server-side fetch, so use these instead. They live in separate
// rate buckets and fail over each other.
const TRANSLATE_ENDPOINTS: { url: (text: string, target: "fa" | "ar") => string; parse: (data: unknown) => string | null }[] = [
  {
    // Standard single-segment client (chrome-ex): [[["translated","src",...],...]]
    url: (text, target) =>
      `${TRANSLATE_HOSTS[0]}?client=chrome-ex&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text.slice(0, 4500))}`,
    parse: (data) =>
      Array.isArray((data as unknown[][])?.[0])
        ? (data as unknown[][])[0].map((s) => (Array.isArray(s) ? String(s[0] ?? "") : "")).join("")
        : null,
  },
  {
    // Chrome-extension dictionary client: ["sentence one", "sentence two"]
    url: (text, target) =>
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${target}&q=${encodeURIComponent(text.slice(0, 4500))}`,
    parse: (data) =>
      Array.isArray(data)
        ? (data as unknown[]).filter((s): s is string => typeof s === "string").join("")
        : null,
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gtxTranslate(text: string, target: "fa" | "ar"): Promise<string | null> {
  if (!text.trim()) return text;
  for (let attempt = 0; attempt < 6; attempt++) {
    const endpoint = TRANSLATE_ENDPOINTS[attempt % TRANSLATE_ENDPOINTS.length];
    try {
      const res = await fetch(endpoint.url(text, target), {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) {
        // Rate limited — back off generously before retrying.
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (res.ok) {
        const out = endpoint.parse(await res.json());
        if (out) return out;
      }
    } catch {
      // try next endpoint / attempt
    }
    await sleep(1000 * (attempt + 1));
  }
  return null;
}

/**
 * Translates text chunk by chunk. Returns null when ANY chunk fails so
 * callers never save a body that mixes translated and English text.
 */
async function translateInChunks(text: string, target: "fa" | "ar"): Promise<string | null> {
  if (!text.trim()) return text;

  const chunks: string[] = [];
  if (text.length < 4000) {
    chunks.push(text);
  } else {
    const paragraphs = text.split(/\n\n+/);
    let current = "";
    for (const p of paragraphs) {
      if (current.length + p.length + 2 > 3800) {
        if (current) chunks.push(current);
        current = p;
      } else {
        current = current ? `${current}\n\n${p}` : p;
      }
    }
    if (current) chunks.push(current);
  }

  // Sequential + throttled: firing all chunks at once triggers Google 429s.
  const results: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await sleep(500);
    const result = await gtxTranslate(chunks[i], target);
    if (!result) return null;
    results.push(result);
  }
  return results.join("\n\n");
}

export async function translateArticle(
  en: { title: string; excerpt: string; body: string },
  target: "fa" | "ar",
): Promise<{ title: string; excerpt: string; body: string } | null> {
  const title = await gtxTranslate(en.title, target);
  if (!title) return null;
  let excerpt = "";
  if (en.excerpt) {
    const translatedExcerpt = await gtxTranslate(en.excerpt, target);
    if (!translatedExcerpt) return null;
    excerpt = translatedExcerpt;
  }
  const body = await translateInChunks(en.body, target);
  if (!body) return null;
  return { title, excerpt, body };
}

// ---------- Language validation ----------

const CYRILLIC_RE = /[\u0400-\u04FF]/;
// Both supported RTL locales (fa/ar) are written in Arabic script.
const RTL_LETTER_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const SCRIPTED_LETTER_RE =
  /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

function stripMarkdownNoise(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_`|~]/g, " ");
}

/**
 * Detects fa/ar text that is not actually written in the target language:
 * Cyrillic runs (a known Google Translate glitch, e.g. "Миниятур" inside an
 * Arabic sentence) or content whose letters are mostly Latin because the
 * translation silently failed. Brand names, URLs and markdown syntax are
 * ignored so legitimate mixed tokens don't trigger false positives.
 */
export function isWrongLanguage(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  const clean = stripMarkdownNoise(text);
  if (CYRILLIC_RE.test(clean)) return true;
  const letters = clean.match(SCRIPTED_LETTER_RE);
  if (!letters || letters.length === 0) return false;
  const rtl = letters.filter((c) => RTL_LETTER_RE.test(c)).length;
  // Short fields like titles legitimately keep proper nouns in Latin
  // (e.g. "The Elusive Samurai فصل 2 ‒ قسمت 6") — only require that part of
  // the text is actually written in the target script.
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 12) {
    return !letters.some((c) => RTL_LETTER_RE.test(c));
  }
  return rtl / letters.length < 0.5;
}

export function isFaArContentValid(t: {
  title?: string | null;
  excerpt?: string | null;
  body?: string | null;
}): boolean {
  return !(
    isWrongLanguage(t.title ?? undefined) ||
    isWrongLanguage(t.excerpt ?? undefined) ||
    isWrongLanguage(t.body ?? undefined)
  );
}

// ---------- Cover image ----------

async function downloadCover(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 8 * 1024 * 1024) return null;

    const ext = ct.includes("png") ? ".png" : ct.includes("webp") ? ".webp" : ".jpg";
    const filename = `web-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const pathname = `uploads/web-articles/${filename}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(pathname, buffer, { access: "public", addRandomSuffix: false });
      return blob.url;
    }
    const dir = path.join(process.cwd(), "public", "uploads", "web-articles");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/web-articles/${filename}`;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function estimateReadingTime(text: string): number {
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

const SOURCE_REFERENCE_LABELS: Record<Locale, { label: string; article: string }> = {
  en: { label: "Source", article: "Original Article" },
  fa: { label: "منبع", article: "مقاله اصلی" },
  ar: { label: "المصدر", article: "المقال الأصلي" },
};

function buildSourceReference(sourceUrl: string, siteName: string, locale: Locale): string {
  const t = SOURCE_REFERENCE_LABELS[locale];
  return `\n\n---\n\n> 🌐 **${t.label}:** [${siteName} — ${t.article}](${sourceUrl})`;
}

// Matches a trailing source-reference block (any locale) appended by this pipeline.
const SOURCE_REFERENCE_TAIL_RE = /\n*---\n+> 🌐 \*\*[^*\n]+\*\*:?\s*\[[^\]]*\]\([^)]*\)\s*$/;

const TOPIC_LABELS: Record<string, Record<Locale, string>> = {
  printing: { en: "3D Printing", fa: "چاپ سه‌بعدی", ar: "الطباعة ثلاثية الأبعاد" },
  collecting: { en: "Collecting", fa: "کلکسیون", ar: "جمع التماثيل" },
  painting: { en: "Painting", fa: "نقاشی", ar: "الرسوم" },
};

// ---------- Content quality ----------

const MIN_PROSE_CHARS = 800;
const MAX_LINK_DENSITY = 0.35;

/**
 * Rejects scraped pages that aren't real articles: pages whose extracted
 * "content" is mostly link lists (navigation, sidebars, episode widgets)
 * or that simply have too little prose to make a readable post.
 */
export function evaluateContentQuality(markdown: string): {
  ok: boolean;
  reason?: string;
} {
  const withoutImages = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // Visible text keeps anchor labels but drops URLs/markdown syntax.
  const visible = withoutImages
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (visible.length < MIN_PROSE_CHARS) {
    return { ok: false, reason: "low_content" };
  }
  const linkChars = (() => {
    const linkRe = /\[([^\]]*)\]\([^)]*\)/g;
    let sum = 0;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(withoutImages)) !== null) sum += m[1].length;
    return sum;
  })();
  const linkDensity = visible.length > 0 ? linkChars / visible.length : 1;
  if (linkDensity > MAX_LINK_DENSITY) {
    return { ok: false, reason: "link_list_page" };
  }
  return { ok: true };
}

// ---------- Main pipeline ----------

export type ImportResult = {
  slug: string;
  title: string;
  status: "imported" | "skipped" | "failed";
  error?: string;
};

export async function importWebArticle(candidate: WebArticleCandidate): Promise<ImportResult> {
  const slug = `web-${slugify(candidate.title || "article")}-${djb2(candidate.url)}`;

  const existing = await prisma.blogPost.findFirst({
    where: { sourceUrl: candidate.url },
  });
  if (existing) return { slug, title: candidate.title || slug, status: "skipped" };

  const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
  if (existingSlug) return { slug, title: candidate.title || slug, status: "skipped" };

  const scraped = await scrapeArticle(candidate.url);
  if (!scraped) return { slug, title: candidate.title || slug, status: "failed", error: "scrape_failed" };

  // Reject pages without real article content before spending translations.
  const quality = evaluateContentQuality(scraped.markdown);
  if (!quality.ok) {
    return { slug, title: scraped.title, status: "failed", error: quality.reason };
  }

  const coverImage = await downloadCover(scraped.image || candidate.image || "");

  const siteName = scraped.siteName || candidate.sourceName || new URL(candidate.url).hostname;
  const topic = candidate.topic || "collecting";

  // Build en translation
  const enBody = scraped.markdown + buildSourceReference(candidate.url, siteName, "en");
  const enExcerpt = scraped.description?.slice(0, 300) || null;
  const tagLabel = TOPIC_LABELS[topic] || TOPIC_LABELS.collecting;

  const [fa, ar] = await Promise.all([
    translateArticle({ title: scraped.title, excerpt: enExcerpt || "", body: scraped.markdown }, "fa"),
    translateArticle({ title: scraped.title, excerpt: enExcerpt || "", body: scraped.markdown }, "ar"),
  ]);

  // Never publish fa/ar content that silently stayed English or came back in
  // the wrong language — fail the import so a future run can retry.
  if (!fa || !ar || !isFaArContentValid(fa) || !isFaArContentValid(ar)) {
    return { slug, title: scraped.title, status: "failed", error: "translation_failed" };
  }

  const faBody = fa.body + buildSourceReference(candidate.url, siteName, "fa");
  const arBody = ar.body + buildSourceReference(candidate.url, siteName, "ar");

  const readingTime = estimateReadingTime(scraped.markdown);

  await prisma.blogPost.create({
    data: {
      slug,
      coverImage: coverImage || scraped.image,
      category: topic,
      readingTime,
      isPublished: true,
      isTrending: false,
      publishedAt: new Date(),
      sourceType: "RSS",
      sourceUrl: candidate.url,
      sourceAuthor: siteName,
      sourceSiteName: siteName,
      translations: {
        create: [
          {
            locale: "fa",
            tag: tagLabel.fa,
            title: fa.title,
            excerpt: fa.excerpt || enExcerpt,
            body: faBody,
          },
          {
            locale: "en",
            tag: tagLabel.en,
            title: scraped.title,
            excerpt: enExcerpt,
            body: enBody,
          },
          {
            locale: "ar",
            tag: tagLabel.ar,
            title: ar.title,
            excerpt: ar.excerpt || enExcerpt,
            body: arBody,
          },
        ],
      },
    },
  });

  return { slug, title: scraped.title, status: "imported" };
}

export async function importWebArticles(max = MAX_ARTICLES_PER_RUN): Promise<ImportResult[]> {
  const candidates = await discoverCandidates();
  const results: ImportResult[] = [];

  for (const candidate of candidates) {
    if (results.filter((r) => r.status === "imported").length >= max) break;
    const result = await importWebArticle(candidate);
    if (result.status === "imported" && result.slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug: result.slug },
        select: { id: true },
      });
      if (post) await notifySubscribersOfNewPost(post.id);
    }
    results.push(result);
  }

  return results;
}

/**
 * Legacy RSS imports stored a single translation row labeled "fa" containing
 * raw untranslated English (and no en/ar rows at all). Detect such posts and
 * rebuild all three locales from the embedded English source text.
 */
export async function repairRssTranslations(limit = 2): Promise<string[]> {
  const fixed: string[] = [];

  const posts = await prisma.blogPost.findMany({
    where: { slug: { startsWith: "rss-" }, isPublished: true },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  for (const post of posts) {
    if (fixed.length >= limit) break;
    const trs = post.translations;
    let en = trs.find((t) => t.locale === "en");
    const fa = trs.find((t) => t.locale === "fa");
    const ar = trs.find((t) => t.locale === "ar");

    // No en row: recover the English source from a mislabeled legacy row.
    if (!en) {
      const fallback = fa ?? ar;
      if (!fallback) continue;
      if (isWrongLanguage(fallback.title) || isWrongLanguage(fallback.body)) {
        en = fallback;
      } else {
        // Valid fa/ar content but no English source — nothing to rebuild from.
        continue;
      }
    }

    try {
      let repaired = false;
      for (const locale of ["fa", "ar"] as const) {
        const existing = locale === "fa" ? fa : ar;
        const needsWork =
          !existing ||
          existing.id === en.id || // the mislabeled row itself
          isWrongLanguage(existing.title) ||
          isWrongLanguage(existing.excerpt) ||
          isWrongLanguage(existing.body);
        if (!needsWork) continue;

        const t = await translateArticle(
          { title: en.title, excerpt: en.excerpt ?? "", body: en.body ?? "" },
          locale,
        );
        if (!t || !isFaArContentValid(t)) continue;

        const data = { title: t.title, excerpt: t.excerpt || null, body: t.body };
        if (existing) {
          // Also covers the mislabeled legacy row itself (id === en.id):
          // overwrite its English content with the proper translation.
          await prisma.blogPostTranslation.update({ where: { id: existing.id }, data });
        } else {
          await prisma.blogPostTranslation.create({
            data: { postId: post.id, locale, tag: en.tag, ...data },
          });
        }
        repaired = true;
      }

      // Ensure an actual "en" row exists when we recovered from a mislabeled one.
      if (!trs.some((t) => t.locale === "en")) {
        await prisma.blogPostTranslation.create({
          data: {
            postId: post.id,
            locale: "en",
            tag: en.tag,
            title: en.title,
            excerpt: en.excerpt,
            body: en.body ?? "",
          },
        });
        repaired = true;
      }

      if (repaired) fixed.push(post.slug);
    } catch (err) {
      console.error("[web-articles] rss repair failed", post.slug, err);
    }
  }

  return fixed;
}

/**
 * Detect imported web articles whose fa/ar translations silently fell back to
 * English or came back in the wrong language (e.g. Cyrillic glitches) and
 * re-translate them. Returns the slugs that were repaired.
 */
export async function retranslateBrokenImports(limit = 2): Promise<string[]> {
  const fixed: string[] = [];

  const posts = await prisma.blogPost.findMany({
    where: { slug: { startsWith: "web-" }, isPublished: true },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  for (const post of posts) {
    if (fixed.length >= limit) break;
    const en = post.translations.find((t) => t.locale === "en");
    const fa = post.translations.find((t) => t.locale === "fa");
    const ar = post.translations.find((t) => t.locale === "ar");
    if (!en || !fa || !ar) continue;

    // Drop the English source-reference block so it isn't translated into the
    // body — a localized one is appended again afterwards.
    const enCoreBody = en.body.replace(SOURCE_REFERENCE_TAIL_RE, "");

    try {
      if (!isFaArContentValid(fa)) {
        const t = await translateArticle(
          { title: en.title, excerpt: en.excerpt ?? "", body: enCoreBody },
          "fa",
        );
        if (t && isFaArContentValid(t)) {
          await prisma.blogPostTranslation.update({
            where: { postId_locale: { postId: post.id, locale: "fa" } },
            data: {
              title: t.title,
              excerpt: t.excerpt || null,
              body: t.body + buildSourceReference(post.sourceUrl ?? "", post.sourceSiteName ?? "Source", "fa"),
            },
          });
        }
      }
      if (!isFaArContentValid(ar)) {
        const t = await translateArticle(
          { title: en.title, excerpt: en.excerpt ?? "", body: enCoreBody },
          "ar",
        );
        if (t && isFaArContentValid(t)) {
          await prisma.blogPostTranslation.update({
            where: { postId_locale: { postId: post.id, locale: "ar" } },
            data: {
              title: t.title,
              excerpt: t.excerpt || null,
              body: t.body + buildSourceReference(post.sourceUrl ?? "", post.sourceSiteName ?? "Source", "ar"),
            },
          });
        }
      }
      // Re-read to confirm both locales are now properly translated.
      const after = await prisma.blogPostTranslation.findMany({
        where: { postId: post.id, locale: { in: ["fa", "ar"] } },
        select: { locale: true, title: true, excerpt: true, body: true },
      });
      const stillBroken = after.some((t) => !isFaArContentValid(t));
      if (!stillBroken) fixed.push(post.slug);
    } catch (err) {
      console.error("[web-articles] retranslate failed", post.slug, err);
    }
  }

  return fixed;
}
