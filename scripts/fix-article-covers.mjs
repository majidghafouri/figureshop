#!/usr/bin/env node
/**
 * Fix blog articles that have SVG/vector cover images.
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

const SLUG_TO_SEARCH = {
  "buying-guide-anime-figures": "anime figure collectible toy",
  "top-10-marvel-figures-collectors": "marvel superhero action figure",
  "receive-figures-safely": "package delivery unboxing parcel",
  "movie-figures-that-make-a-collection": "movie character figurine collection",
  "trusted-figure-brands": "anime figurine brand display",
  "shelving-and-display-ideas": "display shelf collectibles cabinet",
  "top-10-figures-2026": "anime figure collection 2024",
  "new-anime-figures-preorder": "anime figure preorder new",
  "original-vs-knockoff": "fake vs real product comparison",
  "figure-care-guide": "cleaning dusting delicate items",
  "theme-collections-ideas": "themed collection display shelf",
};

async function downloadFromUnsplash(query) {
  const url = `https://source.unsplash.com/1200x630/?${encodeURIComponent(query)}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function downloadFromPicsum(seed) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/630`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function main() {
  if (!existsSync(COVER_DIR)) {
    await mkdir(COVER_DIR, { recursive: true });
  }

  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { coverImage: { endsWith: ".svg" } },
        { coverImage: { contains: "/blog/" } },
        { coverSvg: { not: null } },
      ],
    },
    select: { id: true, slug: true, coverImage: true },
  });

  console.log(`Found ${posts.length} articles with SVG/vector covers.`);

  let updated = 0;
  for (const post of posts) {
    const query = SLUG_TO_SEARCH[post.slug] || post.slug.replace(/-/g, " ");
    const filename = `${post.slug}.jpg`;
    const filepath = path.join(COVER_DIR, filename);

    console.log(`\n[${post.slug}] Downloading for query: "${query}"`);

    let buf = await downloadFromUnsplash(query);
    if (!buf || buf.length < 1000) {
      console.log(`  Unsplash failed, trying Picsum...`);
      buf = await downloadFromPicsum(post.slug);
    }

    if (!buf || buf.length < 1000) {
      console.log(`  ✗ Failed to download image, skipping.`);
      continue;
    }

    await writeFile(filepath, buf);
    const coverUrl = `/uploads/blog-covers/${filename}`;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { coverImage: coverUrl, coverSvg: null },
    });

    console.log(`  ✓ Saved ${coverUrl} (${(buf.length / 1024).toFixed(1)} KB)`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated}/${posts.length} articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
