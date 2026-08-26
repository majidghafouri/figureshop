#!/usr/bin/env node
/**
 * Fix ALL blog articles that have SVG/vector cover images.
 * Replaces them with relevant photos downloaded from Unsplash.
 *
 * Usage: node scripts/fix-article-covers.mjs
 */
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

const COVER_DIR = path.resolve("public/uploads/blog-covers");

const KEYWORD_MAP = {
  "anime": "anime figure collectible",
  "figure": "anime figure toy",
  "care": "cleaning dusting delicate items",
  "collect": "collection display shelf",
  "brand": "product quality brand",
  "shelf": "display shelf cabinet",
  "knockoff": "fake vs real comparison",
  "preorder": "new product launch",
  "marvel": "marvel superhero action figure",
  "dc": "dc comics superhero figure",
  "gundam": "gundam robot model kit",
  "dragon ball": "dragon ball z figure",
  "one piece": "one piece anime figure",
  "naruto": "naruto anime figure",
  "demon slayer": "demon slayer anime figure",
  "attack on titan": "attack on titan figure",
  "display": "collectible display shelf",
  "store": "toy store shop",
  "review": "product review unboxing",
  "shipping": "package delivery box",
  "unboxing": "unboxing package delivery",
  "authentic": "authentic genuine product",
  "fake": "fake counterfeit comparison",
  "care guide": "cleaning delicate items",
  "maintenance": "cleaning maintaining items",
  "theme": "themed collection display",
  "collection": "figure collection display",
  "buying guide": "shopping store guide",
  "beginner": "starter beginner guide",
  "top 10": "best collection display",
  "best": "best rated product",
  "new": "new product launch",
  "trending": "popular trending items",
  "safety": "safe packaging delivery",
  "package": "package delivery parcel",
  "delivery": "delivery shipping box",
  "shelf idea": "creative shelf display",
  "display idea": "creative display arrangement",
};

function guessSearchQuery(slug, titleEn) {
  if (titleEn) {
    const words = titleEn.toLowerCase().split(/\s+/).slice(0, 6);
    return words.join(" ");
  }
  const clean = slug.replace(/\d{4}-\d{2}-\d{2}$/, "").replace(/-/g, " ");
  for (const [keyword, query] of Object.entries(KEYWORD_MAP)) {
    if (clean.includes(keyword)) return query;
  }
  return clean + " collectible figure";
}

async function downloadImage(query, fallbackSeed) {
  const tags = query.replace(/\s+/g, ",").slice(0, 80);
  try {
    const url = `https://loremflickr.com/1200/630/${tags}`;
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 2000) return buf;
    }
  } catch {}
  try {
    const fallbackTags = "figure,collectible,anime";
    const url = `https://loremflickr.com/1200/630/${fallbackTags}`;
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 2000) return buf;
    }
  } catch {}
  return null;
}

async function main() {
  if (!existsSync(COVER_DIR)) {
    await mkdir(COVER_DIR, { recursive: true });
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { coverImage: { endsWith: ".svg" } },
        { coverImage: { contains: "/api/blog/cover/" } },
        { coverSvg: { not: null } },
      ],
    },
    select: {
      id: true,
      slug: true,
      coverImage: true,
      translations: { select: { locale: true, title: true }, where: { locale: "en" }, take: 1 },
    },
  });

  console.log(`Found ${posts.length} articles with SVG/vector covers.\n`);

  let updated = 0;
  let failed = 0;

  for (const post of posts) {
    const titleEn = post.translations[0]?.title ?? "";
    const query = guessSearchQuery(post.slug, titleEn);
    const filename = `${post.slug}.jpg`;
    const filepath = path.join(COVER_DIR, filename);

    process.stdout.write(`[${post.slug}] "${query}" ... `);

    const buf = await downloadImage(query, post.slug);
    if (!buf) {
      console.log("FAILED");
      failed++;
      continue;
    }

    await writeFile(filepath, buf);
    const coverUrl = `/uploads/blog-covers/${filename}`;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { coverImage: coverUrl, coverSvg: null },
    });

    console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}, Total: ${posts.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
