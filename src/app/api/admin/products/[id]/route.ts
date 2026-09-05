import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { Locale } from "@/lib/i18n";
import { logAudit } from "@/lib/audit";

type ProductPayload = {
  slug?: string;
  sku?: string;
  categorySlug?: string;
  brand?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  isActive?: boolean;
  isDeactivated?: boolean;
  isFeatured?: boolean;
  isSpecial?: boolean;
  heightCm?: string;
  material?: string;
  weightGrams?: number;
  images?: string[];
  musicUrl?: string;
  musicTitle?: string;
  bgImage?: string;
  bgOpacity?: number;
  bgBlur?: number;
  cursorUrl?: string;
  cursorName?: string;
  name?: Record<string, string>;
  shortDescription?: Record<string, string>;
  description?: Record<string, string>;
  features?: Record<string, string[]>;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<ProductPayload>(await req.text());
  if (!body) return fail("invalid_body");
  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return fail("not_found", 404);

  const category = body.categorySlug
    ? await prisma.category.findUnique({ where: { slug: body.categorySlug } })
    : null;

  const data: Prisma.ProductUpdateInput = {};
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.sku !== undefined) data.sku = body.sku || null;
  if (body.categorySlug !== undefined)
    data.category = category ? { connect: { id: category.id } } : { disconnect: true };
  if (body.brand !== undefined) data.brand = body.brand || null;
  if (body.price !== undefined) data.price = Math.round(body.price);
  if (body.compareAtPrice !== undefined)
    data.compareAtPrice = body.compareAtPrice ? Math.round(body.compareAtPrice) : null;
  if (body.stock !== undefined) data.stock = Math.max(0, Math.round(body.stock));
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.isDeactivated !== undefined) data.isDeactivated = body.isDeactivated;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.isSpecial !== undefined) data.isSpecial = body.isSpecial;
  const compareAt = body.compareAtPrice ?? existing.compareAtPrice;
  const finalPrice = body.price ?? existing.price;
  data.hasDiscount = !!(compareAt && compareAt > finalPrice);
  if (body.heightCm !== undefined) data.heightCm = body.heightCm || null;
  if (body.material !== undefined) data.material = body.material || null;
  if (body.weightGrams !== undefined) data.weightGrams = body.weightGrams ?? null;
  if (body.images !== undefined) data.images = body.images?.filter(Boolean) ?? [];
  if (body.musicUrl !== undefined) data.musicUrl = body.musicUrl?.trim() || null;
  if (body.musicTitle !== undefined) data.musicTitle = body.musicTitle?.trim() || null;
  if (body.bgImage !== undefined) data.bgImage = body.bgImage?.trim() || null;
  if (body.bgOpacity !== undefined) data.bgOpacity = body.bgOpacity ?? 0.15;
  if (body.bgBlur !== undefined) data.bgBlur = body.bgBlur ?? 20;
  if (body.cursorUrl !== undefined) data.cursorUrl = body.cursorUrl?.trim() || null;
  if (body.cursorName !== undefined) data.cursorName = body.cursorName?.trim() || null;

  await prisma.$transaction(async (tx) => {
    if (body.name) {
      for (const loc of ["fa", "en", "ar"] as Locale[]) {
        const name = body.name?.[loc]?.trim() || body.name?.fa?.trim();
        if (!name) continue;
        const upsert = {
          name,
          shortDescription: body.shortDescription?.[loc]?.trim() || null,
          description: body.description?.[loc]?.trim() || null,
          features: body.features?.[loc]?.length
            ? JSON.stringify(body.features[loc])
            : null,
        };
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: params.id, locale: loc } },
          update: upsert,
          create: { productId: params.id, locale: loc, ...upsert },
        });
      }
    }
    await tx.product.update({ where: { id: params.id }, data });
  });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { translations: true, category: true },
  });

  const changes: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const old = (existing as Record<string, unknown>)[k];
    if (JSON.stringify(old) !== JSON.stringify(v)) changes[k] = { from: old, to: v };
  }
  if (body.name) changes.name = "updated";
  if (Object.keys(changes).length > 0) {
    await logAudit({ user: user!, action: "update", entity: "product", entityId: params.id, details: { changes } });
  }

  return ok({ product });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const existing = await prisma.product.findUnique({ where: { id: params.id }, select: { slug: true } });
  await prisma.product.delete({ where: { id: params.id } });
  await logAudit({ user: user!, action: "delete", entity: "product", entityId: params.id, details: { slug: existing?.slug } });
  return ok({ deleted: true });
}
