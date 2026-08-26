import { NextRequest } from "next/server";
import { ok, fail, requireAdmin } from "@/lib/api";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const targetType = searchParams.get("targetType") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "50", 10)));

  const where: Record<string, unknown> = {};
  if (status === "pending") where.isApproved = false;
  if (status === "approved") where.isApproved = true;
  if (targetType) where.targetType = targetType;

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, body: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.comment.count({ where }),
  ]);

  return ok({ items, total, page, perPage });
}
