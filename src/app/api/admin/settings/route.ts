import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const MASKED = "••••••••";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const rows = await prisma.setting.findMany({ orderBy: { group: "asc" } });
  const settings = rows.map((r) => ({
    key: r.key,
    group: r.group,
    isSecret: r.isSecret,
    value: r.isSecret ? MASKED : r.value,
    updatedAt: r.updatedAt,
  }));
  return ok({ settings });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{
    key?: string;
    value?: string;
    group?: string;
    isSecret?: boolean;
  }>(await req.text());
  if (!body) return fail("body_required");

  const key = body.key?.trim();
  if (!key) return fail("key_required");
  if (!/^[A-Za-z0-9_.-]+$/.test(key)) return fail("key_invalid");
  if (body.value === undefined) return fail("value_required");

  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      value: body.value,
      group: body.group?.trim() || null,
      isSecret: body.isSecret !== false,
    },
    update: {
      value: body.value,
      group: body.group?.trim() || null,
      isSecret: body.isSecret !== false,
    },
  });

  await logAudit({ user: user!, action: "upsert", entity: "setting", entityId: key, details: { key, group: body.group } });
  return ok({ saved: true }, 201);
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{ key?: string; value?: string }>(await req.text());
  if (!body) return fail("body_required");
  const key = body.key?.trim();
  if (!key) return fail("key_required");
  if (body.value === undefined) return fail("value_required");

  const existing = await prisma.setting.findUnique({ where: { key } });
  if (!existing) return fail("not_found", 404);

  await prisma.setting.update({ where: { key }, data: { value: body.value } });
  await logAudit({ user: user!, action: "update", entity: "setting", entityId: key, details: { key } });
  return ok({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const key = req.nextUrl.searchParams.get("key")?.trim();
  if (!key) return fail("key_required");

  await prisma.setting.deleteMany({ where: { key } });
  await logAudit({ user: user!, action: "delete", entity: "setting", entityId: key, details: { key } });
  return ok({ deleted: true });
}
