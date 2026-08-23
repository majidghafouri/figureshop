import { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth";
import { getRequestMeta } from "@/lib/analytics";

export const VISITOR_COOKIE = "ff_vid";

export const REACTION_TARGETS = ["PRODUCT", "ARTICLE"] as const;
export type ReactionTargetType = (typeof REACTION_TARGETS)[number];

export const REACTION_KINDS = ["like", "love", "haha", "wow", "sad", "fire"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export function isReactionTarget(value: unknown): value is ReactionTargetType {
  return (REACTION_TARGETS as readonly string[]).includes(value as string);
}

export function isReactionKind(value: unknown): value is ReactionKind {
  return (REACTION_KINDS as readonly string[]).includes(value as string);
}

// ---------- Visitor identity ----------

const VISITOR_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function getVisitorIdFromRequest(req: NextRequest): string | null {
  const raw = req.cookies.get(VISITOR_COOKIE)?.value ?? "";
  return VISITOR_ID_RE.test(raw) ? raw : null;
}

export function newVisitorId(): string {
  return crypto.randomUUID();
}

function geoFromRequest(req: NextRequest): { country: string | null; city: string | null } {
  const country = req.headers.get("x-vercel-ip-country");
  const rawCity = req.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }
  return { country, city };
}

type ResolvedVisitor = {
  id: string;
  userId: string | null;
  isNew: boolean;
};

/**
 * Resolve the acting visitor for a request. Registered users are always
 * mapped to a single user-linked visitor row (so their reactions follow the
 * account across devices); anonymous visitors use the ff_vid cookie UUID.
 */
export async function resolveVisitor(
  req: NextRequest,
  opts: { createIfMissing?: boolean } = {},
): Promise<ResolvedVisitor> {
  const createIfMissing = opts.createIfMissing ?? true;
  const meta = getRequestMeta(req);
  const geo = geoFromRequest(req);
  const touch = {
    ipAddress: meta.ip,
    country: geo.country,
    city: geo.city,
    userAgent: meta.userAgent?.slice(0, 500),
    lastSeenAt: new Date(),
  };

  const sessionUser = await getSessionUserFromRequest(req);
  const vid = getVisitorIdFromRequest(req);

  if (sessionUser) {
    let visitor = await prisma.visitor.findUnique({ where: { userId: sessionUser.id } });
    if (!visitor && vid) {
      // Adopt this device's anonymous visitor if it isn't claimed yet.
      const deviceVisitor = await prisma.visitor.findUnique({ where: { id: vid } });
      if (deviceVisitor && !deviceVisitor.userId) visitor = deviceVisitor;
    }
    if (visitor) {
      const updated = await prisma.visitor.update({
        where: { id: visitor.id },
        data: { userId: visitor.userId ?? sessionUser.id, ...touch },
      });
      return { id: updated.id, userId: updated.userId, isNew: false };
    }
    if (!createIfMissing) {
      return { id: vid ?? newVisitorId(), userId: sessionUser.id, isNew: true };
    }
    const created = await prisma.visitor.create({
      data: { id: vid ?? newVisitorId(), userId: sessionUser.id, ...touch },
    });
    return { id: created.id, userId: created.userId, isNew: !vid };
  }

  if (vid) {
    const updated = await prisma.visitor.update({ where: { id: vid }, data: touch });
    return { id: updated.id, userId: updated.userId, isNew: false };
  }
  if (!createIfMissing) return { id: "", userId: null, isNew: false };
  const created = await prisma.visitor.create({ data: { id: newVisitorId(), ...touch } });
  return { id: created.id, userId: created.userId, isNew: true };
}

/** Register/refresh visitor info; never throws. Used by analytics tracking. */
export async function registerVisitor(req: NextRequest): Promise<void> {
  try {
    await resolveVisitor(req, { createIfMissing: true });
  } catch (err) {
    console.error("[reactions] registerVisitor failed", err);
  }
}

// ---------- Rate limiting (per instance) ----------

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear();
  return true;
}

// ---------- Reactions ----------

export async function targetExists(
  targetType: ReactionTargetType,
  targetId: string,
): Promise<boolean> {
  if (targetType === "PRODUCT") {
    const p = await prisma.product.findUnique({ where: { id: targetId }, select: { isActive: true } });
    return !!p?.isActive;
  }
  const post = await prisma.blogPost.findUnique({
    where: { id: targetId },
    select: { isPublished: true, publishedAt: true },
  });
  return !!post?.isPublished && (!!post.publishedAt && post.publishedAt <= new Date());
}

export async function setReaction(
  targetType: ReactionTargetType,
  targetId: string,
  visitorId: string,
  kind: ReactionKind,
): Promise<string | null> {
  const existing = await prisma.reaction.findUnique({
    where: { targetType_targetId_visitorId: { targetType, targetId, visitorId } },
  });
  if (!existing) {
    await prisma.reaction.create({ data: { targetType, targetId, visitorId, kind } });
    return kind;
  }
  if (existing.kind === kind) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return null;
  }
  await prisma.reaction.update({ where: { id: existing.id }, data: { kind } });
  return kind;
}

export async function getReactionSummary(
  targetType: ReactionTargetType,
  targetId: string,
  viewerVisitorId?: string | null,
): Promise<{ counts: Record<string, number>; total: number; mine: string | null }> {
  const rows = await prisma.reaction.findMany({
    where: { targetType, targetId },
    select: { kind: true, visitorId: true },
  });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  const mine = viewerVisitorId
    ? rows.find((r) => r.visitorId === viewerVisitorId)?.kind ?? null
    : null;
  return { counts, total: rows.length, mine };
}
