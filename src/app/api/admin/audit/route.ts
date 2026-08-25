import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, requireAdmin } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const takeRaw = Number(req.nextUrl.searchParams.get("take") ?? "50");
  const take = Math.min(Math.max(takeRaw, 1), 200);

  const entity = req.nextUrl.searchParams.get("entity")?.trim() || undefined;
  const action = req.nextUrl.searchParams.get("action")?.trim() || undefined;
  const cursor = req.nextUrl.searchParams.get("cursor")?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = logs.length > take;
  if (hasMore) logs.pop();

  return ok({ logs, hasMore });
}
