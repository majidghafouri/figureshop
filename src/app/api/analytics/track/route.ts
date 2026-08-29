import { NextRequest } from "next/server";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";
import {
  trackEvent,
  getRequestMeta,
  isAnalyticsEventType,
} from "@/lib/analytics";
import { getVisitorIdFromRequest, registerVisitor } from "@/lib/reactions";
import { rateLimitOrFail } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limiter = rateLimitOrFail(req, 120, 60_000, "track:ip");
  if (!limiter.allowed) return limiter.response;

  const body = parseJson<{
    type?: string;
    path?: string;
    productId?: string;
    categorySlug?: string;
    query?: string;
    sessionId?: string;
  }>(await req.text());

  if (!body || !body.type || !isAnalyticsEventType(body.type)) {
    return fail("invalid_event");
  }

  const user = await getSessionUserFromRequest(req);
  const meta = getRequestMeta(req);

  await trackEvent({
    type: body.type,
    path: body.path,
    productId: body.productId,
    categorySlug: body.categorySlug,
    query: body.query,
    sessionId: body.sessionId,
    userId: user?.id ?? null,
    ip: meta.ip,
    userAgent: meta.userAgent,
    referrer: meta.referrer,
  });

  // Keep the visitor registry (IP / location / UA) fresh for admin insights.
  if (getVisitorIdFromRequest(req)) {
    await registerVisitor(req);
  }

  return ok({ tracked: true }, 201);
}
