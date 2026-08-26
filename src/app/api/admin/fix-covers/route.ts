import { NextRequest } from "next/server";
import { ok, requireAdmin } from "@/lib/api";
import prisma from "@/lib/db";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEYWORD_MAP: Record<string, string> = {
  anime: "anime figure collectible",
  figure: "anime figure toy",
  care: "cleaning dusting delicate items",
  collect: "collection display shelf",
  brand: "product quality brand",
  shelf: "display shelf cabinet",
  knockoff: "fake vs real comparison",
  preorder: "new product launch",
  marvel: "marvel superhero action figure",
  dc: "dc comics superhero figure",
  gundam: "gundam robot model kit",
  "dragon ball": "dragon ball z figure",
  "one piece": "one piece anime figure",
  naruto: "naruto anime figure",
  "demon slayer": "demon slayer anime figure",
  "attack on titan": "attack on titan figure",
  display: "collectible display shelf",
  store: "toy store shop",
  review: "product review unboxing",
  shipping: "package delivery box",
  unboxing: "unboxing package delivery",
  authentic: "authentic genuine product",
  fake: "fake counterfeit comparison",
  "care guide": "cleaning delicate items",
  maintenance: "cleaning maintaining items",
  theme: "themed collection display",
  collection: "figure collection display",
  "buying guide": "shopping store guide",
  beginner: "starter beginner guide",
  "top 10": "best collection display",
  best: "best rated product",
  safety: "safe packaging delivery",
  package: "package delivery parcel",
  delivery: "delivery shipping box",
  "shelf idea": "creative shelf display",
  "display idea": "creative display arrangement",
  photograph: "figure photography setup",
  gift: "gift present wrapping",
  starter: "starter collection beginner",
  paint: "painting resin miniatures",
  resin: "resin 3d print figure",
  print: "3d printing figure",
};

function guessSearchQuery(slug: string, titleEn: string): string {
  if (titleEn) {
    return titleEn.toLowerCase().split(/\s+/).slice(0, 6).join(" ");
  }
  const clean = slug.replace(/\d{4}-\d{2}-\d{2}$/, "").replace(/-/g, " ");
  for (const [keyword, query] of Object.entries(KEYWORD_MAP)) {
    if (clean.includes(keyword)) return query;
  }
  return clean + " collectible figure";
}

async function fetchImageBuffer(query: string): Promise<Buffer | null> {
  const tags = query.replace(/\s+/g, ",").slice(0, 80);
  const urls = [
    `https://loremflickr.com/1200/630/${tags}`,
    `https://loremflickr.com/1200/630/figure,collectible,anime`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch {}
  }
  return null;
}

async function uploadToBlob(buffer: Buffer, slug: string): Promise<string> {
  const name = `blog-covers/${slug}-${crypto.randomBytes(4).toString("hex")}.jpg`;
  const blob = await put(name, buffer, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isCronAuth = secret && auth === `Bearer ${secret}`;

  if (!isCronAuth) {
    const { error } = await requireAdmin(req);
    if (error) return error;
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
      translations: {
        select: { locale: true, title: true },
        where: { locale: "en" },
        take: 1,
      },
    },
  });

  if (posts.length === 0) return ok({ total: 0, results: [] });

  const results: { slug: string; status: string; url?: string }[] = [];

  for (const post of posts) {
    const titleEn = post.translations[0]?.title ?? "";
    const query = guessSearchQuery(post.slug, titleEn);

    const buf = await fetchImageBuffer(query);
    if (!buf) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { coverImage: null, coverSvg: null },
      });
      results.push({ slug: post.slug, status: "nulled" });
      continue;
    }

    const blobUrl = await uploadToBlob(buf, post.slug);
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { coverImage: blobUrl, coverSvg: null },
    });
    results.push({ slug: post.slug, status: "updated", url: blobUrl });
  }

  return ok({ total: posts.length, results });
}
