import { NextRequest } from "next/server";
import { ok, fail, requireAdmin } from "@/lib/api";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.isApproved !== "boolean") return fail("isApproved boolean required", 400);

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return fail("Comment not found", 404);

  const updated = await prisma.comment.update({
    where: { id: params.id },
    data: { isApproved: body.isApproved },
  });

  await logAudit({
    user,
    action: body.isApproved ? "approve" : "reject",
    entity: "Comment",
    entityId: comment.id,
    details: { targetType: comment.targetType, targetId: comment.targetId },
  });

  return ok({ item: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return fail("Comment not found", 404);

  // Delete replies first
  await prisma.comment.deleteMany({ where: { parentId: params.id } });
  await prisma.comment.delete({ where: { id: params.id } });

  await logAudit({
    user,
    action: "delete",
    entity: "Comment",
    entityId: comment.id,
    details: { targetType: comment.targetType, targetId: comment.targetId },
  });

  return ok({ deleted: true });
}
