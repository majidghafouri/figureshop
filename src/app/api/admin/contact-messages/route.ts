import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const takeRaw = Number(req.nextUrl.searchParams.get("take") ?? "50");
  const take = Math.min(Math.max(takeRaw, 1), 200);

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  return ok({ messages });
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{ id?: string; isRead?: boolean }>(await req.text());
  const id = body?.id?.trim();
  if (!id) return fail("id_required");
  const isRead = body?.isRead ?? true;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return fail("not_found", 404);

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { isRead },
  });
  await logAudit({ user: user!, action: isRead ? "mark_read" : "mark_unread", entity: "contact_message", entityId: id });
  return ok({ message });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return fail("id_required");

  await prisma.contactMessage.deleteMany({ where: { id } });
  await logAudit({ user: user!, action: "delete", entity: "contact_message", entityId: id });
  return ok({ deleted: true });
}
