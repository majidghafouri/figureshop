import Link from "next/link";
import { notFound } from "next/navigation";
import { Locale, localePrefix, isLocale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-dictionaries";
import prisma from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const prefix = localePrefix(locale);
  const dict = getDictionary(locale);
  const p = dict.admin.products;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { translations: true },
    }),
    prisma.category.findMany({
      include: { translations: { where: { locale } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!product) notFound();

  const t = (loc: string) => product.translations.find((x) => x.locale === loc);

  const initial = {
    id: product.id,
    slug: product.slug,
    sku: product.sku ?? "",
    brand: product.brand ?? "",
    price: String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
    stock: String(product.stock),
    isActive: product.isActive,
    isDeactivated: product.isDeactivated,
    isFeatured: product.isFeatured,
    isSpecial: product.isSpecial,
    heightCm: product.heightCm ?? "",
    material: product.material ?? "",
    weightGrams: product.weightGrams ? String(product.weightGrams) : "",
    images: product.images,
    musicUrl: product.musicUrl ?? "",
    musicTitle: product.musicTitle ?? "",
    bgImage: product.bgImage ?? "",
    bgOpacity: String(product.bgOpacity),
    bgBlur: String(product.bgBlur),
    cursorUrl: product.cursorUrl ?? "",
    cursorName: product.cursorName ?? "",
    categorySlug: product.categoryId
      ? (await prisma.category.findUnique({ where: { id: product.categoryId! } }))?.slug ?? ""
      : "",
    name: { fa: t("fa")?.name ?? "", en: t("en")?.name ?? "", ar: t("ar")?.name ?? "" },
    shortDescription: {
      fa: t("fa")?.shortDescription ?? "",
      en: t("en")?.shortDescription ?? "",
      ar: t("ar")?.shortDescription ?? "",
    },
    description: {
      fa: t("fa")?.description ?? "",
      en: t("en")?.description ?? "",
      ar: t("ar")?.description ?? "",
    },
  };

  return (
    <div>
      <Link href={`${prefix}/admin/products`} className="text-[13px] font-[950] text-[var(--primary)] hover:underline">
        ← {p.back}
      </Link>
      <h2 className="mt-2 text-[18px] font-[1000] text-[var(--text)]">{p.editTitle}</h2>
      <div className="mt-4">
        <ProductForm
          isEdit
          dict={p}
          redirectHref={`${prefix}/admin/products`}
          initial={initial}
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.translations[0]?.name ?? c.slug,
          }))}
        />
      </div>
    </div>
  );
}
