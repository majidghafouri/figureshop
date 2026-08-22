import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UA = "FigureforgeBot/1.0 (+https://figurforgj.com)";

// Two endpoints in separate rate buckets, failing over each other.
const TRANSLATE_ENDPOINTS = [
  {
    url: (text, target) =>
      `https://translate.googleapis.com/translate_a/single?client=chrome-ex&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text.slice(0, 4500))}`,
    parse: (data) =>
      Array.isArray(data?.[0])
        ? data[0].map((s) => (Array.isArray(s) ? String(s[0] ?? "") : "")).join("")
        : null,
  },
  {
    url: (text, target) =>
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${target}&q=${encodeURIComponent(text.slice(0, 4500))}`,
    parse: (data) =>
      Array.isArray(data) ? data.filter((s) => typeof s === "string").join("") : null,
  },
];

const LABELS = {
  en: { label: "Source", article: "Original Article" },
  fa: { label: "منبع", article: "مقاله اصلی" },
  ar: { label: "المصدر", article: "المقال الأصلي" },
};

// Matches a trailing source-reference block (any locale) appended by this pipeline.
const REF_RE = /\n*---\n+> 🌐 \*\*[^*\n]+\*\*:?\s*\[[^\]]*\]\([^)]*\)\s*$/;

const CYRILLIC_RE = /[\u0400-\u04FF]/;
const RTL_LETTER_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const SCRIPTED_LETTER_RE =
  /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

function stripMarkdownNoise(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_`|~]/g, " ");
}

function isWrongLanguage(text) {
  if (!text || !text.trim()) return false;
  const clean = stripMarkdownNoise(text);
  if (CYRILLIC_RE.test(clean)) return true;
  const letters = clean.match(SCRIPTED_LETTER_RE);
  if (!letters || letters.length === 0) return false;
  const rtl = letters.filter((c) => RTL_LETTER_RE.test(c)).length;
  // Short fields like titles legitimately keep proper nouns in Latin —
  // only require that part of the text is in the target script.
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 12) {
    return !letters.some((c) => RTL_LETTER_RE.test(c));
  }
  return rtl / letters.length < 0.5;
}

function buildReference(sourceUrl, siteName, locale) {
  const t = LABELS[locale] || LABELS.en;
  return `\n\n---\n\n> 🌐 **${t.label}:** [${siteName} — ${t.article}](${sourceUrl})`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gtxTranslate(text, target) {
  if (!text.trim()) return text;
  for (let attempt = 0; attempt < 6; attempt++) {
    const endpoint = TRANSLATE_ENDPOINTS[attempt % TRANSLATE_ENDPOINTS.length];
    try {
      const res = await fetch(endpoint.url(text, target), {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (res.ok) {
        const out = endpoint.parse(await res.json());
        if (out && !isWrongLanguage(out)) return out;
        if (out) {
          console.log(`    translate returned wrong-language output, retrying (${attempt + 1})`);
        }
      }
    } catch {
      // try next endpoint / attempt
    }
    await sleep(1000 * (attempt + 1));
  }
  return null;
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { slug: { startsWith: "web-" }, sourceType: "RSS" },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  const legacyRssPosts = await prisma.blogPost.findMany({
    where: { slug: { startsWith: "rss-" } },
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });
  posts.push(...legacyRssPosts);

  let checked = 0;
  let fixedFields = 0;
  let failed = 0;

  for (const post of posts) {
    const siteName = post.sourceSiteName || post.sourceAuthor || "Source";

    // ---- Legacy RSS posts: a single mislabeled row holding English, no en/ar.
    if (post.slug.startsWith("rss-")) {
      const en = post.translations.find((t) => t.locale === "en");
      const fa = post.translations.find((t) => t.locale === "fa");
      const ar = post.translations.find((t) => t.locale === "ar");

      let english = en;
      if (!english) {
        const fallback = fa ?? ar;
        if (!fallback) continue;
        if (isWrongLanguage(fallback.title) || isWrongLanguage(fallback.body)) {
          english = fallback;
        } else {
          continue;
        }
      }

      for (const locale of ["fa", "ar"]) {
        const tr = post.translations.find((t) => t.locale === locale);
        const needsWork =
          !tr ||
          tr.id === english.id ||
          isWrongLanguage(tr.title) ||
          isWrongLanguage(tr.excerpt) ||
          isWrongLanguage(tr.body);
        if (!needsWork) continue;

        console.log(`Fixing ${post.slug} [${locale}] (legacy rss import)`);
        const t = await gtxTranslate(english.title, locale);
        const body = await gtxTranslate(english.body ?? "", locale);
        let excerpt = null;
        if (english.excerpt) {
          excerpt = await gtxTranslate(english.excerpt.slice(0, 300), locale);
        }
        if (!t || !body || isWrongLanguage(t) || isWrongLanguage(body)) {
          console.log("    translation failed — leaving unchanged");
          failed++;
          continue;
        }
        const data = { title: t, excerpt, body };
        if (tr) {
          await prisma.blogPostTranslation.update({ where: { id: tr.id }, data });
        } else {
          await prisma.blogPostTranslation.create({
            data: { postId: post.id, locale, tag: english.tag, ...data },
          });
        }
        fixedFields++;
      }

      if (!post.translations.some((t) => t.locale === "en")) {
        await prisma.blogPostTranslation.create({
          data: {
            postId: post.id,
            locale: "en",
            tag: english.tag,
            title: english.title,
            excerpt: english.excerpt,
            body: english.body ?? "",
          },
        });
        fixedFields++;
      }
      continue;
    }

    // ---- Web articles: per-field validation against the en translation.
    const en = post.translations.find((t) => t.locale === "en");
    if (!en) continue;

    for (const locale of ["fa", "ar"]) {
      const tr = post.translations.find((t) => t.locale === locale);
      if (!tr) continue;
      checked++;

      const brokenTitle = isWrongLanguage(tr.title);
      const brokenExcerpt = isWrongLanguage(tr.excerpt);
      const brokenBody = isWrongLanguage(tr.body);
      if (!brokenTitle && !brokenExcerpt && !brokenBody) continue;

      console.log(`Fixing ${post.slug} [${locale}]:` +
        [brokenTitle && "title", brokenExcerpt && "excerpt", brokenBody && "body"]
          .filter(Boolean).join(", "));

      const data = {};

      if (brokenTitle) {
        const title = await gtxTranslate(en.title, locale);
        if (!title) {
          console.log("    title translation failed — leaving unchanged");
          failed++;
          continue;
        }
        data.title = title;
      }

      if (brokenExcerpt && en.excerpt) {
        const excerpt = await gtxTranslate(en.excerpt, locale);
        if (!excerpt) {
          console.log("    excerpt translation failed — leaving unchanged");
        } else {
          data.excerpt = excerpt;
        }
      }

      if (brokenBody) {
        // Translate the English core body (without its reference block), then
        // re-append a properly localized reference.
        const enCore = en.body.replace(REF_RE, "");
        const body = await gtxTranslate(enCore, locale);
        if (!body) {
          console.log("    body translation failed — leaving unchanged");
          failed++;
          continue;
        }
        data.body =
          body + buildReference(post.sourceUrl ?? "", siteName, locale);
      }

      if (Object.keys(data).length === 0) continue;

      await prisma.blogPostTranslation.update({ where: { id: tr.id }, data });
      fixedFields++;
      console.log(`    updated ${Object.keys(data).join(", ")}`);
    }
  }

  console.log(
    `Checked ${checked} translations across ${posts.length} web articles: ` +
      `${fixedFields} translation(s) repaired, ${failed} failure(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
