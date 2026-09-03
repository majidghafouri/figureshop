import RssParser from "rss-parser";
import prisma from "@/lib/db";
import { downloadCover, isFaArContentValid, translateArticle } from "@/lib/web-articles";

const parser = new RssParser({
  timeout: 10_000,
  headers: {
    "User-Agent": "Figurforgj-Bot/1.0 (+https://figurforgj.com)",
  },
});

export type RssFeedConfig = {
  url: string;
  name: string;
};

export type FetchResult = {
  feedName: string;
  imported: number;
  skipped: number;
  error?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").trim();
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export async function fetchSingleFeed(feed: RssFeedConfig): Promise<FetchResult> {
  try {
    const parsed = await parser.parseURL(feed.url);
    let imported = 0;
    let skipped = 0;

    for (const item of parsed.items.slice(0, 10)) {
      const title = item.title?.trim();
      if (!title) {
        skipped++;
        continue;
      }

      const slug = `rss-${slugify(title)}`;
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) {
        skipped++;
        continue;
      }

      const rawBody =
        item.contentSnippet?.trim() ||
        item.content?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ||
        "";
      const image =
        item.enclosure?.url ||
        item.content?.match(/<img[^>]+src="([^"]+)"/)?.[1] ||
        null;
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      const excerpt = item.contentSnippet?.trim().slice(0, 300) || null;
      const tagName = feed.name || parsed.title || "web";

      // RSS feeds are English; translate once per target locale so every site
      // language gets a proper version. Never publish untranslated content —
      // a failed import is retried on the next cron run.
      const [fa, ar] = await Promise.all([
        translateArticle({ title, excerpt: excerpt ?? "", body: rawBody }, "fa"),
        translateArticle({ title, excerpt: excerpt ?? "", body: rawBody }, "ar"),
      ]);
      if (!fa || !ar || !isFaArContentValid(fa) || !isFaArContentValid(ar)) {
        console.warn("[rss-aggregator] translation failed, skipping:", slug);
        skipped++;
        continue;
      }

      await prisma.blogPost.create({
        data: {
          slug,
          coverImage: (await downloadCover(image ?? "")) ?? null,
          category: parsed.title || feed.name || "web",
          readingTime: estimateReadingTime(rawBody),
          isPublished: true,
          isTrending: false,
          publishedAt: pubDate,
          sourceType: "RSS",
          sourceUrl: item.link || feed.url,
          sourceAuthor: item.creator || item.author || parsed.title || null,
          sourceSiteName: parsed.title || feed.name || null,
          translations: {
            create: [
              {
                locale: "en",
                title,
                tag: tagName,
                excerpt,
                body: rawBody,
              },
              {
                locale: "fa",
                title: fa.title,
                tag: tagName,
                excerpt: fa.excerpt || excerpt,
                body: fa.body,
              },
              {
                locale: "ar",
                title: ar.title,
                tag: tagName,
                excerpt: ar.excerpt || excerpt,
                body: ar.body,
              },
            ],
          },
        },
      });
      imported++;
    }

    return { feedName: feed.name || parsed.title || feed.url, imported, skipped };
  } catch (err) {
    return {
      feedName: feed.name,
      imported: 0,
      skipped: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function fetchAllFeeds(feeds: RssFeedConfig[]): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  for (const feed of feeds) {
    const result = await fetchSingleFeed(feed);
    results.push(result);
  }
  return results;
}
