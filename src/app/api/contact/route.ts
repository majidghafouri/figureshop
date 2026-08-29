import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/api";
import { getSetting } from "@/lib/settings";
import { sendEmail } from "@/lib/email";
import { rateLimitOrFail } from "@/lib/rate-limit";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const limiter = rateLimitOrFail(req, 5, 60_000, "contact:ip");
  if (!limiter.allowed) return limiter.response;

  const body = parseJson<ContactPayload>(await req.text());
  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const message = body?.message?.trim() ?? "";
  const subject = body?.subject?.trim() ?? "";

  if (!name || !message) return fail("missing_fields");
  if (!EMAIL_RE.test(email)) return fail("invalid_email");

  await prisma.contactMessage.create({
    data: { name, email, message, subject: subject || null },
  });

  await notifyOwner({ name, email, subject, message });

  return ok({ sent: true }, 201);
}

async function notifyOwner(msg: { name: string; email: string; subject: string; message: string }) {
  try {
    const to = (await getSetting("contact_email")) || process.env.MAIL_FROM;
    if (!to) return;
    await sendEmail(
      to,
      `پیام جدید از فرم تماس - ${msg.subject || msg.name}`,
      `نام: ${msg.name}\nایمیل: ${msg.email}\nموضوع: ${msg.subject || "-"}\nپیام:\n${msg.message}`,
      `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#f1f5f9;padding:28px">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 12px 36px rgba(20,45,90,.10)">
          <div style="font-size:20px;font-weight:900;color:#0D1633">پیام جدید از فرم تماس</div>
          <table style="margin-top:16px;font-size:13.5px;color:#334155;line-height:1.9">
            <tr><td style="font-weight:900;color:#0D1633;padding-left:12px">نام</td><td>${escapeHtml(msg.name)}</td></tr>
            <tr><td style="font-weight:900;color:#0D1633;padding-left:12px">ایمیل</td><td dir="ltr">${escapeHtml(msg.email)}</td></tr>
            <tr><td style="font-weight:900;color:#0D1633;padding-left:12px">موضوع</td><td>${escapeHtml(msg.subject || "-")}</td></tr>
          </table>
          <div style="margin-top:14px;padding:14px;background:#f8fafc;border-radius:12px;font-size:13.5px;color:#0f172a;line-height:1.9">${escapeHtml(msg.message)}</div>
        </div>
      </div>`,
    );
  } catch {
    // notification is best-effort; the message is already stored in the DB
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
