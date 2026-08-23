import { NextRequest } from "next/server";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return fail("login_required", 401);

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { productId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({ productIds: favorites.map((f) => f.productId) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return fail("login_required", 401);

  const body = parseJson<{ productId?: string }>(await req.text());
  if (!body?.productId || typeof body.productId !== "string") return fail("invalid_product");

  const product = await prisma.product.findUnique({
    where: { id: body.productId },
    select: { isActive: true },
  });
  if (!product?.isActive) return fail("target_not_found", 404);

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId: body.productId } },
  });

  let favorited: boolean;
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    favorited = false;
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productId: body.productId } });
    favorited = true;
  }

  const count = await prisma.favorite.count({ where: { productId: body.productId } });
  return ok({ favorited, count });
}
