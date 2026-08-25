import { NextRequest } from "next/server";
import { ok, fail, parseJson, requireAdmin } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

function normalizeEmail(raw: string): string | null {
  const e = (raw ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin(req);
  if (error) return error;

  const body = parseJson<{ to?: string; subject?: string; body?: string }>(await req.text());
  const requested = normalizeEmail(body?.to ?? "");
  const fallbackFrom = normalizeEmail((await getSetting("mail_from")) ?? "") ?? null;
  const target = requested ?? fallbackFrom;
  if (!target) return fail("invalid_email");

  const subject = (body?.subject ?? "").trim() || "ایمیل از فیگرفورج";
  const text = (body?.body ?? "").trim();
  if (!text) return fail("body_required");

  const html = `<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px">
    <div style="background:#fff;border-radius:18px;padding:32px 28px;box-shadow:0 12px 36px rgba(20,45,90,.10)">
      <div style="font-size:22px;font-weight:900;color:#0D1633">فیگرفورج</div>
      <div style="margin-top:18px;font-size:14px;color:#334155;line-height:2;white-space:pre-wrap">${escapeHtml(text)}</div>
    </div>
  </div>
</body></html>`;

  try {
    await sendEmail(target, subject, text, html);
    await logAudit({ user: user!, action: "send_test_email", entity: "email", details: { to: target, subject } });
    return ok({ sent: true, to: target });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return fail("send_failed", 400, { detail });
  }
}