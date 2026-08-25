import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { allowedUsers: { select: { id: true, email: true, phone: true, name: true } } },
  });
  return ok({ coupons });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{
    code?: string;
    type?: string;
    value?: number;
    minOrderAmount?: number | null;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    validFrom?: string;
    validUntil?: string;
    isActive?: boolean;
    userIds?: string[];
  }>(await req.text());

  if (!body?.code || !body?.type || body.value == null || !body.validFrom || !body.validUntil) {
    return fail("fill_required");
  }

  const code = body.code.trim().toUpperCase();
  if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(body.type)) {
    return fail("invalid_type");
  }
  if (body.type === "PERCENTAGE" && (body.value < 1 || body.value > 100)) {
    return fail("invalid_percentage");
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return fail("code_exists");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: body.type as "PERCENTAGE" | "FIXED_AMOUNT",
      value: body.value,
      minOrderAmount: body.minOrderAmount ?? null,
      maxDiscountAmount: body.maxDiscountAmount ?? null,
      usageLimit: body.usageLimit ?? null,
      validFrom: new Date(body.validFrom),
      validUntil: new Date(body.validUntil),
      isActive: body.isActive ?? true,
      ...(body.userIds && body.userIds.length > 0
        ? { allowedUsers: { connect: body.userIds.map((id) => ({ id })) } }
        : {}),
    },
  });
  await logAudit({ user: user!, action: "create", entity: "coupon", entityId: coupon.id, details: { code, type: body.type, value: body.value } });
  return ok({ coupon }, 201);
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{
    id?: string;
    code?: string;
    type?: string;
    value?: number;
    minOrderAmount?: number | null;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    validFrom?: string;
    validUntil?: string;
    isActive?: boolean;
    userIds?: string[];
  }>(await req.text());

  if (!body?.id) return fail("missing_id");

  const data: Record<string, unknown> = {};
  if (body.code) {
    const code = body.code.trim().toUpperCase();
    const existing = await prisma.coupon.findFirst({ where: { code, NOT: { id: body.id } } });
    if (existing) return fail("code_exists");
    data.code = code;
  }
  if (body.type && ["PERCENTAGE", "FIXED_AMOUNT"].includes(body.type)) {
    data.type = body.type;
  }
  if (body.value != null) data.value = body.value;
  if (body.minOrderAmount !== undefined) data.minOrderAmount = body.minOrderAmount;
  if (body.maxDiscountAmount !== undefined) data.maxDiscountAmount = body.maxDiscountAmount;
  if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit;
  if (body.validFrom) data.validFrom = new Date(body.validFrom);
  if (body.validUntil) data.validUntil = new Date(body.validUntil);
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const coupon = await prisma.$transaction(async (tx) => {
    await tx.coupon.update({ where: { id: body.id }, data });
    if (body.userIds !== undefined) {
      await tx.coupon.update({
        where: { id: body.id },
        data: {
          allowedUsers: body.userIds.length > 0
            ? { set: body.userIds.map((id) => ({ id })) }
            : { set: [] },
        },
      });
    }
    return tx.coupon.findUnique({ where: { id: body.id } });
  });
  await logAudit({ user: user!, action: "update", entity: "coupon", entityId: body.id, details: { changes: Object.keys(data) } });
  return ok({ coupon });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("missing_id");

  await prisma.coupon.delete({ where: { id } });
  await logAudit({ user: user!, action: "delete", entity: "coupon", entityId: id });
  return ok({ deleted: true });
}
