import { NextRequest } from "next/server";
import { ok, fail, requireAdmin, parseJson } from "@/lib/api";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    include: { translations: true },
  });
  if (!post) return fail("Not found", 404);

  return ok(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const rawBody = await req.text();
  const body = parseJson<{
    slug?: string;
    coverImage?: string | null;
    category?: string | null;
    readingTime?: number | null;
    isPublished?: boolean;
    isTrending?: boolean;
    sourceType?: "ORIGINAL" | "RSS";
    sourceUrl?: string | null;
    sourceAuthor?: string | null;
    sourceSiteName?: string | null;
    translations?: { locale: string; tag?: string; title: string; excerpt?: string; body: string }[];
  }>(rawBody);

  if (!body) return fail("Invalid JSON", 400);

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Not found", 404);

  if (body.slug && body.slug !== existing.slug) {
    const slugTaken = await prisma.blogPost.findUnique({ where: { slug: body.slug } });
    if (slugTaken) return fail("Slug already exists", 409);
  }

  const publishedAt = body.isPublished === true && !existing.isPublished
    ? new Date()
    : body.isPublished === false
      ? null
      : existing.publishedAt;

  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.readingTime !== undefined && { readingTime: body.readingTime }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
      ...(body.isTrending !== undefined && { isTrending: body.isTrending }),
      ...(body.sourceType !== undefined && { sourceType: body.sourceType }),
      ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
      ...(body.sourceAuthor !== undefined && { sourceAuthor: body.sourceAuthor }),
      ...(body.sourceSiteName !== undefined && { sourceSiteName: body.sourceSiteName }),
      publishedAt,
    },
  });

  if (body.translations) {
    for (const t of body.translations) {
      await prisma.blogPostTranslation.upsert({
        where: { postId_locale: { postId: post.id, locale: t.locale } },
        update: { tag: t.tag || null, title: t.title, excerpt: t.excerpt || null, body: t.body },
        create: { postId: post.id, locale: t.locale, tag: t.tag || null, title: t.title, excerpt: t.excerpt || null, body: t.body },
      });
    }
  }

  await logAudit({
    user,
    action: "update",
    entity: "BlogPost",
    entityId: post.id,
    details: { slug: post.slug },
  });

  return ok({ id: post.id, slug: post.slug });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Not found", 404);

  await prisma.blogPostTranslation.deleteMany({ where: { postId: params.id } });
  await prisma.blogPost.delete({ where: { id: params.id } });

  await logAudit({
    user,
    action: "delete",
    entity: "BlogPost",
    entityId: params.id,
    details: { slug: existing.slug },
  });

  return ok({ deleted: true });
}
