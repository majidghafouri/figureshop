import { NextRequest } from "next/server";
import { ok, fail, parseJson } from "@/lib/api";
import prisma from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) return fail("targetType and targetId required", 400);

  const comments = await prisma.comment.findMany({
    where: { targetType, targetId, isApproved: true, parentId: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      replies: {
        where: { isApproved: true },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({ items: comments });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromRequest(req);
  if (!session) return fail("Unauthorized", 401);
  const user = session;

  const body = parseJson<{ targetType: string; targetId: string; parentId?: string; body: string }>(await req.text());
  if (!body) return fail("Invalid JSON", 400);
  if (!body.targetType || !body.targetId || !body.body?.trim()) return fail("targetType, targetId, and body are required", 400);
  if (!["PRODUCT", "ARTICLE"].includes(body.targetType)) return fail("Invalid targetType", 400);

  const trimmedBody = body.body.trim();
  if (trimmedBody.length < 2 || trimmedBody.length > 1000) return fail("Comment must be 2-1000 characters", 400);

  // If replying to a parent comment
  if (body.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: body.parentId } });
    if (!parent) return fail("Parent comment not found", 404);
    if (parent.userId !== user.id) return fail("You can only reply to your own comments", 403);

    const replyCount = await prisma.comment.count({ where: { parentId: body.parentId } });
    if (replyCount >= 5) return fail("max_replies", 400);
  } else {
    // Check one comment per user per target for top-level comments
    const existing = await prisma.comment.findFirst({
      where: { userId: user.id, targetType: body.targetType, targetId: body.targetId, parentId: null },
    });
    if (existing) return fail("already_commented", 400);
  }

  // For product comments: verify user has a completed order with this product
  if (body.targetType === "PRODUCT" && !body.parentId) {
    const hasOrder = await prisma.orderItem.findFirst({
      where: {
        productId: body.targetId,
        order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      },
    });
    if (!hasOrder) return fail("purchase_required", 403);
  }

  // For article comments: rate limit 3 per day
  if (body.targetType === "ARTICLE" && !body.parentId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.comment.count({
      where: { userId: user.id, targetType: "ARTICLE", parentId: null, createdAt: { gte: today } },
    });
    if (todayCount >= 3) return fail("daily_limit", 429);
  }

  const comment = await prisma.comment.create({
    data: {
      userId: user.id,
      targetType: body.targetType,
      targetId: body.targetId,
      parentId: body.parentId || null,
      body: trimmedBody,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return ok({ item: comment }, 201);
}
