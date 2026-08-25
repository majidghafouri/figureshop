import { NextRequest } from "next/server";
import prisma from "@/lib/db";
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

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const categories = await prisma.category.findMany({
    include: { translations: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return ok({ categories });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<CategoryPayload>(await req.text());
  if (!body?.slug || !body?.name) return fail("missing_fields");

  const slug = body.slug;
  const name = body.name;
  const description = body.description;

  const category = await prisma.category.create({
    data: {
      slug,
      image: body.image || null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
      translations: {
        create: (["fa", "en", "ar"] as Locale[]).map((loc) => ({
          locale: loc,
          name: name[loc]?.trim() || name.fa?.trim() || slug,
          description: description?.[loc]?.trim() || null,
        })),
      },
    },
    include: { translations: true },
  });

  await logAudit({ user: user!, action: "create", entity: "category", entityId: category.id, details: { slug } });
  return ok({ category }, 201);
}
