import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/api";
import { sendOtpEmail, isEmailConfigured } from "@/lib/email";
import { sendOtpViaLookup, isSmsConfigured } from "@/lib/kavenegar";
import { resolveIdentifierFromBody, generateCode } from "@/lib/identifiers";
import { rateLimitOrFail } from "@/lib/rate-limit";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 3 * 60 * 1000;

type OtpPurpose = "REGISTER" | "PASSWORD_RESET";

export async function POST(req: NextRequest) {
  const ipLimit = rateLimitOrFail(req, 10, 60_000, "otp:ip");
  if (!ipLimit.allowed) return ipLimit.response;

  const body = parseJson<{ email?: string; phone?: string; purpose?: OtpPurpose }>(await req.text());
  const identifier = resolveIdentifierFromBody(body ?? {});
  if (!identifier) return fail("invalid_identifier");

  const targetLimit = rateLimitOrFail(req, 3, 60_000, `otp:${identifier.value}`);
  if (!targetLimit.allowed) return targetLimit.response;

  const purpose = body?.purpose ?? "REGISTER";
  const { field, value } = identifier;

  const user = await prisma.user.findUnique({
    where: field === "email" ? { email: value } : { phone: value },
    select: { password: true },
  });

  if (purpose === "PASSWORD_RESET") {
    if (!user || !user.password) return fail("no_password_set", 404);
  }

  if (purpose === "REGISTER") {
    if (user && user.password) return fail("user_exists_use_login", 409);
  }

  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      [field]: value,
      purpose,
      createdAt: { gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentOtp) {
    return fail("otp_cooldown", 429, {
      retryAfter: Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - recentOtp.createdAt.getTime())) / 1000),
    });
  }

  await prisma.otpCode.updateMany({
    where: { [field]: value, purpose, consumed: false },
    data: { consumed: true },
  });

  const code = generateCode();
  const otp = await prisma.otpCode.create({
    data: {
      [field]: value,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const dev = process.env.NODE_ENV !== "production";
  const transportConfigured =
    field === "email" ? await isEmailConfigured() : await isSmsConfigured();

  try {
    if (dev || !transportConfigured) {
      console.log(`[OTP] ${field}=${value} code=${code} purpose=${purpose}${transportConfigured ? "" : ` (${field} transport not configured)`}`);
    } else if (field === "email") {
      await sendOtpEmail(value, code);
    } else {
      await sendOtpViaLookup(value, code);
    }
  } catch (err) {
    if (dev || !transportConfigured) {
      console.warn("[OTP] send skipped:", err);
    } else {
      await prisma.otpCode.delete({ where: { id: otp.id } }).catch(() => {});
      const detail = err instanceof Error ? err.message : "unknown error";
      return fail(field === "email" ? "email_failed" : "sms_failed", 400, { detail });
    }
  }

  return ok({
    [field]: value,
    expiresIn: OTP_TTL_MS / 1000,
    ...(dev || !transportConfigured ? { devCode: code } : {}),
  });
}
