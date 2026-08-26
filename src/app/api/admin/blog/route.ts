import { NextRequest } from "next/server";
import { ok, fail, requireAdmin, parseJson } from "@/lib/api";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "fa";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "50", 10)));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { slug: { contains: search, mode: "insensitive" } },
      { translations: { some: { title: { contains: search, mode: "insensitive" } } } },
    ];
  }
  if (status === "published") where.isPublished = true;
  if (status === "draft") where.isPublished = false;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        translations: {
          where: { locale },
          select: { title: true, tag: true, excerpt: true },
          take: 1,
        },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blogPost.count({ where }),
  ]);

  const items = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    coverImage: p.coverImage,
    category: p.category,
    readingTime: p.readingTime,
    isPublished: p.isPublished,
    isTrending: p.isTrending,
    sourceType: p.sourceType,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    title: p.translations[0]?.title ?? p.slug,
    tag: p.translations[0]?.tag ?? null,
  }));

  return ok({ items, total, page, perPage });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const rawBody = await req.text();
  const body = parseJson<{
    slug: string;
    coverImage?: string;
    category?: string;
    readingTime?: number;
    isPublished?: boolean;
    isTrending?: boolean;
    sourceType?: "ORIGINAL" | "RSS";
    sourceUrl?: string;
    sourceAuthor?: string;
    sourceSiteName?: string;
    translations: { locale: string; tag?: string; title: string; excerpt?: string; body: string }[];
  }>(rawBody);

  if (!body) return fail("Invalid JSON", 400);
  if (!body.slug || !body.translations?.some((t) => t.locale === "fa" && t.title)) {
    return fail("Slug and Persian title are required", 400);
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: body.slug } });
  if (existing) return fail("Slug already exists", 409);

  const post = await prisma.blogPost.create({
    data: {
      slug: body.slug,
      coverImage: body.coverImage || null,
      category: body.category || null,
      readingTime: body.readingTime || null,
      isPublished: body.isPublished ?? false,
      isTrending: body.isTrending ?? false,
      sourceType: body.sourceType || "ORIGINAL",
      sourceUrl: body.sourceUrl || null,
      sourceAuthor: body.sourceAuthor || null,
      sourceSiteName: body.sourceSiteName || null,
      publishedAt: body.isPublished ? new Date() : null,
    },
  });

  for (const t of body.translations) {
    await prisma.blogPostTranslation.create({
      data: {
        postId: post.id,
        locale: t.locale,
        tag: t.tag || null,
        title: t.title,
        excerpt: t.excerpt || null,
        body: t.body,
      },
    });
  }

  await logAudit({
    user,
    action: "create",
    entity: "BlogPost",
    entityId: post.id,
    details: { slug: post.slug },
  });

  return ok({ id: post.id, slug: post.slug });
}
