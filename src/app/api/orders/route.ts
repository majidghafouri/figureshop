import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";
import { trackEvent, getRequestMeta } from "@/lib/analytics";
import { cancelExpiredOrders } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return fail("unauthorized", 401);

  await cancelExpiredOrders();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ok({ orders });
}

const PAYMENT_METHODS = [
  "ZARINPAL",
  "SNAPPAY",
  "CASH_ON_DELIVERY",
  "GATEWAY_PLACEHOLDER",
  "VANDAR",
] as const;

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return fail("unauthorized", 401);

  const body = parseJson<{
    fullName?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    note?: string;
    paymentMethod?: string;
    couponId?: string;
  }>(await req.text());

  if (!body?.fullName || !body?.phone || !body?.address) {
    return fail("fill_required");
  }
  const { fullName, phone, address } = body;
  const paymentMethod = PAYMENT_METHODS.includes(
    body.paymentMethod as (typeof PAYMENT_METHODS)[number]
  )
    ? (body.paymentMethod as (typeof PAYMENT_METHODS)[number])
    : "GATEWAY_PLACEHOLDER";

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) return fail("empty_cart");

  let subtotal = 0;
  let discount = 0;
  for (const item of cart.items) {
    if (!item.product.isActive || item.product.isDeactivated) {
      return fail("product_not_found", 400, { productId: item.product.id });
    }
    if (item.product.stock < item.quantity) {
      return fail("stock_changed", 400, { productId: item.product.id });
    }
    subtotal += item.product.price * item.quantity;
    if (item.product.compareAtPrice && item.product.compareAtPrice > item.product.price) {
      discount += (item.product.compareAtPrice - item.product.price) * item.quantity;
    }
  }

  // Validate and apply coupon
  let couponDiscount = 0;
  let couponId: string | null = null;
  if (body.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: body.couponId },
      include: { allowedUsers: { select: { id: true } } },
    });
    if (!coupon || !coupon.isActive) return fail("coupon_invalid");
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) return fail("coupon_invalid");
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return fail("coupon_invalid");
    if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) return fail("coupon_invalid");
    if (coupon.allowedUsers.length > 0 && !coupon.allowedUsers.some((u) => u.id === user.id)) {
      return fail("coupon_invalid");
    }

    if (coupon.type === "PERCENTAGE") {
      couponDiscount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount != null) {
        couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
      }
    } else {
      couponDiscount = Math.min(coupon.value, subtotal);
    }
    couponId = coupon.id;
  }

  const shipping = 0;
  const total = Math.max(0, subtotal - couponDiscount);

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }
    const created = await tx.order.create({
      data: {
        userId: user.id,
        paymentMethod,
        fullName,
        phone,
        address,
        postalCode: body.postalCode ?? null,
        note: body.note ?? null,
        subtotal,
        shipping,
        discount: discount + couponDiscount,
        total,
        couponId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: { items: true },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  const meta = getRequestMeta(req);
  await trackEvent({
    type: "ORDER_PLACED",
    path: "/checkout",
    userId: user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    referrer: meta.referrer,
  });

  return ok({ order }, 201);
}
