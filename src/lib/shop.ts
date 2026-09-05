import prisma from "@/lib/db";
import { Locale } from "@/lib/i18n";

export const DEFAULT_CURSOR_URL = "/cursors/default.png";

export type ProductItem = {
  id: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  isDeactivated: boolean;
  isFeatured: boolean;
  isSpecial: boolean;
  hasDiscount: boolean;
  heightCm: string | null;
  material: string | null;
  weightGrams: number | null;
  images: string[];
  musicUrl: string | null;
  musicTitle: string | null;
  bgImage: string | null;
  bgOpacity: number;
  bgBlur: number;
  cursorUrl: string | null;
  cursorName: string | null;
  name: string;
  shortDescription: string | null;
  description: string | null;
  features: string[] | null;
  category: { slug: string; name: string } | null;
  createdAt: Date;
};

export type LocaleProduct = {
  id: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  isDeactivated: boolean;
  isFeatured: boolean;
  isSpecial: boolean;
  hasDiscount: boolean;
  heightCm: string | null;
  material: string | null;
  weightGrams: number | null;
  images: string[];
  musicUrl: string | null;
  musicTitle: string | null;
  bgImage: string | null;
  bgOpacity: number;
  bgBlur: number;
  cursorUrl: string | null;
  cursorName: string | null;
  createdAt: Date;
  translations: {
    locale: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    features: string | null;
  }[];
  category: {
    slug: string;
    translations: { locale: string; name: string }[];
  } | null;
};

export const productInclude = (locale: Locale) => ({
  translations: {
    where: { locale },
  },
  category: {
    include: { translations: { where: { locale } } },
  },
});

export function mapProduct(product: LocaleProduct): ProductItem {
  const t = product.translations[0];
  const category = product.category
    ? {
        slug: product.category.slug,
        name: product.category.translations[0]?.name ?? product.category.slug,
      }
    : null;
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    isActive: product.isActive,
    isDeactivated: product.isDeactivated,
    isFeatured: product.isFeatured,
    isSpecial: product.isSpecial,
    hasDiscount: product.hasDiscount,
    heightCm: product.heightCm,
    material: product.material,
    weightGrams: product.weightGrams,
    images: product.images,
    musicUrl: product.musicUrl,
    musicTitle: product.musicTitle,
    bgImage: product.bgImage,
    bgOpacity: product.bgOpacity,
    bgBlur: product.bgBlur,
    cursorUrl: product.cursorUrl,
    cursorName: product.cursorName,
    name: t?.name ?? "",
    shortDescription: t?.shortDescription ?? null,
    description: t?.description ?? null,
    features: t?.features ? JSON.parse(t.features) : null,
    category,
    createdAt: product.createdAt,
  } as ProductItem;
}

export async function getCategories(locale: Locale) {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    include: { translations: { where: { locale } }, children: { include: { translations: { where: { locale } } } } },
    orderBy: { sortOrder: "asc" },
  });
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.translations[0]?.name ?? c.slug,
    image: c.image,
    children: c.children.map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      name: ch.translations[0]?.name ?? ch.slug,
    })),
  }));
}

export function buildCategoryTree(categories: { id: string; parentId: string | null; slug: string; name: string; image: string | null }[]) {
  const roots = categories.filter((c) => !c.parentId);
  const map = new Map<string, typeof categories>();
  for (const c of categories) {
    const children = map.get(c.id) ?? [];
    map.set(c.id, children);
  }
  return roots.map((r) => ({
    ...r,
    children: categories.filter((c) => c.parentId === r.id),
  }));
}
