import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJson } from "@/lib/api";
import {
  VISITOR_COOKIE,
  isReactionKind,
  isReactionTarget,
  getVisitorIdFromRequest,
  rateLimit,
  resolveVisitor,
  setReaction,
  getReactionSummary,
  targetExists,
} from "@/lib/reactions";
import { getRequestMeta } from "@/lib/analytics";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365 * 2,
  sameSite: "lax" as const,
  httpOnly: true,
};

export async function GET(req: NextRequest) {
  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");
  if (!isReactionTarget(targetType) || !targetId) return fail("invalid_target");

  const vid = getVisitorIdFromRequest(req);
  const summary = await getReactionSummary(targetType, targetId, vid);
  return ok(summary);
}

export async function POST(req: NextRequest) {
  const body = parseJson<{
    targetType?: string;
    targetId?: string;
    kind?: string;
  }>(await req.text());

  if (!body || !isReactionTarget(body.targetType) || !body.targetId || !isReactionKind(body.kind)) {
    return fail("invalid_reaction");
  }
  const { targetType, targetId, kind } = body;

  const meta = getRequestMeta(req);
  if (!rateLimit(meta.ip ?? "unknown", 30, 60_000)) {
    return fail("too_many_requests", 429);
  }

  let exists: boolean;
  try {
    exists = await targetExists(targetType, targetId);
  } catch {
    exists = true; // don't block reactions on a lookup failure
  }
  if (!exists) return fail("target_not_found", 404);

  const visitor = await resolveVisitor(req, { createIfMissing: true });
  const mine = await setReaction(targetType, targetId, visitor.id, kind);
  const summary = await getReactionSummary(targetType, targetId, visitor.id);

  const res = ok({ ...summary, mine }) as NextResponse;
  if (visitor.isNew || !getVisitorIdFromRequest(req)) {
    res.cookies.set(VISITOR_COOKIE, visitor.id, COOKIE_OPTS);
  }
  return res;
}
