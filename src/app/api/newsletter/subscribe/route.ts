import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { subscribeEmail } from "@/lib/newsletter";
import { rateLimitOrFail } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limiter = rateLimitOrFail(req, 5, 60_000, "newsletter:ip");
  if (!limiter.allowed) return limiter.response;

  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const email = typeof body.email === "string" ? body.email : "";
  const locale = ["fa", "en", "ar"].includes(body.locale ?? "") ? body.locale! : "fa";

  if (!email.trim()) {
    return fail("Email is required", 400);
  }

  const user = await getSessionUser().catch(() => null);
  const result = await subscribeEmail(email, locale, user?.id ?? null);

  if (result.status === "invalid") {
    return fail("Invalid email address", 400);
  }
  if (result.status === "error") {
    return fail("Subscription failed, please try again", 500);
  }
  if (result.status === "already") {
    return ok({ subscribed: true, already: true });
  }

  return ok({ subscribed: true, already: false });
}
