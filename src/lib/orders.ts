import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getOrCreateCart } from "@/lib/cart";

export const PAYMENT_DEADLINE_MINUTES = 10;
export const PAYMENT_EXTENSION_MINUTES = 5;
export const CANCEL_LIMIT = 5;
export const CANCEL_WINDOW_MINUTES = 60;

const PAYMENT_DEADLINE_MS = PAYMENT_DEADLINE_MINUTES * 60 * 1000;
const PAYMENT_EXTENSION_MS = PAYMENT_EXTENSION_MINUTES * 60 * 1000;
const CANCEL_WINDOW_MS = CANCEL_WINDOW_MINUTES * 60 * 1000;

export type OrderDeadlineInfo = { createdAt: Date; deadlineExtendedAt: Date | null };

/** Effective payment deadline for an order: createdAt + 10min (+ 5min if extended once). */
export function getPaymentDeadline(order: OrderDeadlineInfo): Date {
  return new Date(
    order.createdAt.getTime() +
      PAYMENT_DEADLINE_MS +
      (order.deadlineExtendedAt ? PAYMENT_EXTENSION_MS : 0)
  );
}

export type CancelResult =
  | { ok: true }
  | {
      ok: false;
      code: "not_found" | "not_pending" | "cancel_limit";
      retryAfterMs?: number;
      limit?: number;
      windowMinutes?: number;
    };

async function restoreStock(tx: Prisma.TransactionClient, items: { productId: string; quantity: number }[]) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/**
 * Cancel unpaid pending orders that passed their payment deadline
 * and return their reserved stock. Returns the number of cancelled orders.
 */
export async function cancelExpiredOrders(): Promise<number> {
  const now = Date.now();
  const baseCutoff = new Date(now - PAYMENT_DEADLINE_MS);
  const extendedCutoff = new Date(now - PAYMENT_DEADLINE_MS - PAYMENT_EXTENSION_MS);

  const [notExtended, extended] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: "PENDING",
        paidAt: null,
        deadlineExtendedAt: null,
        createdAt: { lte: baseCutoff },
      },
      select: { id: true, items: { select: { productId: true, quantity: true } } },
    }),
    prisma.order.findMany({
      where: {
        status: "PENDING",
        paidAt: null,
        deadlineExtendedAt: { not: null },
        createdAt: { lte: extendedCutoff },
      },
      select: { id: true, items: { select: { productId: true, quantity: true } } },
    }),
  ]);

  const expired = [...notExtended, ...extended];
  let count = 0;
  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      await restoreStock(tx, order.items);
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelSource: "AUTO" },
      });
    });
    count++;
  }
  return count;
}

/**
 * Cancel an order on behalf of a user. Enforces the 5 cancellations / 1 hour
 * limit (only user-initiated cancellations count) and returns the reserved stock.
 */
export async function cancelOrderForUser(userId: string, orderId: string): Promise<CancelResult> {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return { ok: false, code: "not_found" };
  if (order.status !== "PENDING") return { ok: false, code: "not_pending" };

  const since = new Date(Date.now() - CANCEL_WINDOW_MS);
  const recentCancels = await prisma.order.findMany({
    where: {
      userId,
      status: "CANCELLED",
      cancelSource: "USER",
      cancelledAt: { gte: since },
    },
    orderBy: { cancelledAt: "asc" },
    select: { cancelledAt: true },
  });

  if (recentCancels.length >= CANCEL_LIMIT) {
    const oldest = recentCancels[0]?.cancelledAt;
    const retryAfterMs = oldest
      ? Math.max(0, oldest.getTime() + CANCEL_WINDOW_MS - Date.now())
      : undefined;
    return {
      ok: false,
      code: "cancel_limit",
      retryAfterMs,
      limit: CANCEL_LIMIT,
      windowMinutes: CANCEL_WINDOW_MINUTES,
    };
  }

  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { productId: true, quantity: true },
  });

  await prisma.$transaction(async (tx) => {
    await restoreStock(tx, items);
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelSource: "USER" },
    });
  });

  return { ok: true };
}

export type PayResult =
  | { ok: true; deadline: Date; extended: boolean }
  | { ok: false; code: "not_found" | "not_pending" | "already_paid" };

/**
 * Start payment for an order: extends the payment deadline by 5 minutes once
 * and returns the effective (possibly extended) deadline.
 */
export async function extendPaymentDeadline(userId: string, orderId: string): Promise<PayResult> {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return { ok: false, code: "not_found" };
  if (order.status !== "PENDING") {
    return { ok: false, code: order.paidAt ? "already_paid" : "not_pending" };
  }

  const extended = !order.deadlineExtendedAt;
  if (extended) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { deadlineExtendedAt: new Date() },
    });
    return { ok: true, deadline: getPaymentDeadline(updated), extended: true };
  }

  return { ok: true, deadline: getPaymentDeadline(order), extended: false };
}

export type ReorderResult =
  | { ok: true; skipped: string[] }
  | { ok: false; code: "not_found" | "not_cancelled" };

/**
 * Re-create a cart from a cancelled order's items so the user can order again.
 * Items that are inactive or out of stock are skipped.
 */
export async function reorderOrder(userId: string, orderId: string): Promise<ReorderResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: { product: { select: { id: true, stock: true, isActive: true, isDeactivated: true } } },
      },
    },
  });
  if (!order) return { ok: false, code: "not_found" };
  if (order.status !== "CANCELLED") return { ok: false, code: "not_cancelled" };

  const { cart } = await getOrCreateCart({ token: null, userId });
  const skipped: string[] = [];

  for (const item of order.items) {
    const product = item.product;
    if (!product.isActive || product.isDeactivated || product.stock < 1) {
      skipped.push(item.productId);
      continue;
    }
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });
    const qty = Math.min(item.quantity, product.stock);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + qty, product.stock) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: qty },
      });
    }
  }

  return { ok: true, skipped };
}
