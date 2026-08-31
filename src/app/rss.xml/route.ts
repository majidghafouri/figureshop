import prisma from "@/lib/db";
import { defaultLocale, localePrefix } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000").replace(/\/$/, "") as string;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { lte: new Date() } },
    include: { translations: { where: { locale: defaultLocale } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const prefix = localePrefix(defaultLocale);
  const items = posts
    .map((post) => {
      const t = post.translations[0];
      const title = t?.title ?? post.slug;
      const excerpt = t?.excerpt ?? "";
      const link = `${SITE_URL}${prefix}/blog/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();
      return `
  <item>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description>${escapeXml(excerpt)}</description>
    <pubDate>${pubDate}</pubDate>
  </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>فیگرفورج | Figureforge Blog</title>
    <link>${SITE_URL}</link>
    <description>فیگرفورج — فیگور و اکشن فیگور اورجینال</description>
    <language>fa</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
