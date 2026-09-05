import { NextRequest, NextResponse } from "next/server";
import { Locale, isLocale } from "@/lib/i18n";
import { ok, fail, parseJson } from "@/lib/api";
import { getOrCreateCart, addToCart, getCartItems } from "@/lib/cart";
import { getSessionUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

function localeFromPath(pathname: string): Locale {
  const m = pathname.match(/^\/(en|ar|fa)(\/|$)/);
  if (m && isLocale(m[1])) return m[1] as Locale;
  return "fa";
}

function withTokenCookie(res: NextResponse, token: string) {
  res.cookies.set("cart_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const locale = localeFromPath(req.nextUrl.pathname);
  const user = await getSessionUserFromRequest(req);
  const token = req.cookies.get("cart_token")?.value ?? null;

  const { cart, newToken } = await getOrCreateCart({
    token,
    userId: user?.id ?? null,
  });
  const items = await getCartItems(cart.id, locale);
  const res = ok({ items });
  if (newToken) return withTokenCookie(res, newToken);
  return res;
}

export async function POST(req: NextRequest) {
  const locale = localeFromPath(req.nextUrl.pathname);
  const body = parseJson<{ productId?: string; quantity?: number }>(await req.text());
  if (!body?.productId) return fail("missing_product");

  const product = await prisma.product.findUnique({
    where: { id: body.productId },
  });
  if (!product || !product.isActive || product.isDeactivated) return fail("product_not_found", 404);
  const qty = Math.max(1, Math.min(Number(body.quantity) || 1, Math.max(1, product.stock)));

  const user = await getSessionUserFromRequest(req);
  const token = req.cookies.get("cart_token")?.value ?? null;

  const result = await addToCart(
    { token, userId: user?.id ?? null },
    body.productId,
    qty,
    locale
  );
  if (result.error) return fail(result.error, 400);

  const res = ok({ items: result.items });
  if (result.newToken) return withTokenCookie(res, result.newToken);
  return res;
}
