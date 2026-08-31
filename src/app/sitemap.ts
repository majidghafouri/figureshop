import { MetadataRoute } from "next";
import prisma from "@/lib/db";
import { locales, localePrefix, Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000") as string;

const STATIC_PATH: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/products", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.4, changeFrequency: "monthly" },
];

function localize(path: string, locale: Locale): string {
  const prefix = localePrefix(locale);
  if (path === "") return prefix || "/";
  return `${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, createdAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const loc = locale as Locale;
    for (const item of STATIC_PATH) {
      entries.push({
        url: `${SITE_URL}${localize(item.path, loc)}`,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        lastModified: new Date(),
      });
    }
    for (const p of products) {
      entries.push({
        url: `${SITE_URL}${localize(`/products/${p.slug}`, loc)}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const c of categories) {
      entries.push({
        url: `${SITE_URL}${localize(`/category/${c.slug}`, loc)}`,
        lastModified: c.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const b of posts) {
      entries.push({
        url: `${SITE_URL}${localize(`/blog/${b.slug}`, loc)}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
