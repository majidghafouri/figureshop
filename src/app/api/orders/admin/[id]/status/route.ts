import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{ status?: string }>(await req.text());
  if (!body) return fail("invalid_body");
  const status = body.status as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) {
    return fail("invalid_status");
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
  if (!order) return fail("not_found", 404);

  const wasCancelled = order.status === "CANCELLED";
  const willBeCancelled = status === "CANCELLED";
  const isPaidStatus = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: isPaidStatus && !order.paidAt ? new Date() : order.paidAt,
        cancelledAt: willBeCancelled ? new Date() : order.cancelledAt,
        cancelSource: willBeCancelled ? "ADMIN" : order.cancelSource,
      },
    });

    if (willBeCancelled && !wasCancelled) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return updatedOrder;
  });

  await logAudit({ user: user!, action: "update_status", entity: "order", entityId: params.id, details: { from: order.status, to: status } });
  return ok({ order: updated });
}
