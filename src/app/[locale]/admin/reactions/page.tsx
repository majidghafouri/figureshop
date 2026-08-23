import { notFound } from "next/navigation";
import { Locale, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import prisma from "@/lib/db";
import ReactionsManager from "@/components/admin/ReactionsManager";

export const dynamic = "force-dynamic";

export default async function AdminReactionsPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);

  const reactions = await prisma.reaction.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      visitor: {
        select: {
          id: true,
          ipAddress: true,
          country: true,
          city: true,
          userAgent: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const articleIds = Array.from(
    new Set(reactions.filter((r) => r.targetType === "ARTICLE").map((r) => r.targetId)),
  );
  const productIds = Array.from(
    new Set(reactions.filter((r) => r.targetType === "PRODUCT").map((r) => r.targetId)),
  );

  const [articles, products] = await Promise.all([
    articleIds.length
      ? prisma.blogPost.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, slug: true, translations: { select: { locale: true, title: true } } },
        })
      : Promise.resolve([]),
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            slug: true,
            translations: { select: { locale: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const translatedTitle = (
    translations: { locale: string; name?: string; title?: string }[],
    fallback: string
  ) =>
    translations.find((t) => t.locale === locale)?.name ??
    translations.find((t) => t.locale === locale)?.title ??
    translations[0]?.name ??
    translations[0]?.title ??
    fallback;

  const targets = new Map<string, { type: "ARTICLE" | "PRODUCT"; slug: string; title: string }>();
  for (const a of articles)
    targets.set(a.id, { type: "ARTICLE", slug: a.slug, title: translatedTitle(a.translations, a.slug) });
  for (const p of products)
    targets.set(p.id, { type: "PRODUCT", slug: p.slug, title: translatedTitle(p.translations, p.slug) });

  return (
    <ReactionsManager
      dict={dict.admin.reactions}
      kindDict={dict.reactions}
      rows={reactions.map((r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        targetSlug: targets.get(r.targetId)?.slug ?? null,
        targetTitle: targets.get(r.targetId)?.title ?? r.targetId,
        kind: r.kind,
        createdAt: r.createdAt.toISOString(),
        visitor: {
          uid: r.visitor.id,
          ip: r.visitor.ipAddress,
          location:
            [r.visitor.city, r.visitor.country].filter(Boolean).join(", ") || null,
          userAgent: r.visitor.userAgent,
          user: r.visitor.user
            ? { id: r.visitor.user.id, name: r.visitor.user.name, email: r.visitor.user.email }
            : null,
        },
      }))}
    />
  );
}
