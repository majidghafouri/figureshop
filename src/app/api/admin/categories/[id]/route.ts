import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { Locale } from "@/lib/i18n";
import { logAudit } from "@/lib/audit";

type CategoryPayload = {
  slug?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  name?: Record<string, string>;
  description?: Record<string, string>;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<CategoryPayload>(await req.text());
  if (!body) return fail("invalid_body");
  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) return fail("not_found", 404);

  const data: Prisma.CategoryUpdateInput = {};
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.image !== undefined) data.image = body.image || null;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  await prisma.$transaction(async (tx) => {
    if (body.name) {
      for (const loc of ["fa", "en", "ar"] as Locale[]) {
        const name = body.name?.[loc]?.trim() || body.name?.fa?.trim();
        if (!name) continue;
        const upsert = {
          name,
          description: body.description?.[loc]?.trim() || null,
        };
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: params.id, locale: loc } },
          update: upsert,
          create: { categoryId: params.id, locale: loc, ...upsert },
        });
      }
    }
    await tx.category.update({ where: { id: params.id }, data });
  });

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { translations: true },
  });

  const changes: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const old = (existing as Record<string, unknown>)[k];
    if (JSON.stringify(old) !== JSON.stringify(v)) changes[k] = { from: old, to: v };
  }
  if (body.name) changes.name = "updated";
  if (Object.keys(changes).length > 0) {
    await logAudit({ user: user!, action: "update", entity: "category", entityId: params.id, details: { changes } });
  }

  return ok({ category });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  await prisma.category.delete({ where: { id: params.id } });
  await logAudit({ user: user!, action: "delete", entity: "category", entityId: params.id });
  return ok({ deleted: true });
}
