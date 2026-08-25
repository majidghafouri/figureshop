import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface AuditUser {
  id: string;
  email: string | null;
}

export async function logAudit(opts: {
  user: AuditUser;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.user.id,
        userEmail: opts.user.email ?? "",
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        details: (opts.details as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  } catch {
    // Non-critical — never block the main request
  }
}
