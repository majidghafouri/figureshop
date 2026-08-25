import { NextRequest } from "next/server";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  const { error, user: adminUser } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{
    userId?: string;
    channel?: string;
    subject?: string;
    body?: string;
  }>(await req.text());

  if (!body?.userId) return fail("userId_required");
  if (!body?.body?.trim()) return fail("body_required");

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true, email: true, phone: true, name: true },
  });

  if (!user) return fail("user_not_found");

  const channel = body.channel || "email";

  if (channel === "email") {
    if (!user.email) return fail("user_no_email");
    const subject = body.subject?.trim() || "پیام از فیگرفورج";
    const text = body.body.trim();
    const html = `<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px">
    <div style="background:#fff;border-radius:18px;padding:32px 28px;box-shadow:0 12px 36px rgba(20,45,90,.10)">
      <div style="font-size:22px;font-weight:900;color:#0D1633">فیگرفورج</div>
      ${user.name ? `<p style="margin:12px 0 0;font-size:14px;color:#53647C">سلام ${escapeHtml(user.name)}،</p>` : ""}
      <div style="margin-top:12px;font-size:14px;color:#334155;line-height:2;white-space:pre-wrap">${escapeHtml(text)}</div>
    </div>
  </div>
</body></html>`;

    try {
      await sendEmail(user.email, subject, text, html);
      await logAudit({ user: adminUser!, action: "send_message", entity: "message", entityId: body.userId, details: { channel: "email", to: user.email, subject } });
      return ok({ sent: true, channel: "email", to: user.email });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unknown error";
      return fail("send_failed", 400, { detail });
    }
  }

  return fail("unsupported_channel");
}
