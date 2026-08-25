import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const body = parseJson<{ accountId?: string }>(await req.text());
  const accountId = body?.accountId?.trim();
  if (!accountId) return fail("accountId_required");

  const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) return fail("not_found", 404);

  const otherMethods = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      password: true,
      phone: true,
      phoneVerified: true,
      email: true,
      emailVerified: true,
      socialAccounts: { select: { id: true, provider: true } },
    },
  });

  if (!otherMethods) return fail("user_not_found", 404);

  const hasPassword = !!otherMethods.password;
  const hasVerifiedPhone = !!otherMethods.phone && otherMethods.phoneVerified;
  const hasVerifiedEmail = !!otherMethods.email && otherMethods.emailVerified;
  const otherSocialCount = otherMethods.socialAccounts.filter(
    (a) => a.id !== accountId
  ).length;

  const totalOtherMethods = [hasPassword, hasVerifiedPhone, hasVerifiedEmail, otherSocialCount > 0].filter(Boolean).length;

  if (totalOtherMethods === 0) {
    return fail("cannot_disconnect_last_method");
  }

  await prisma.socialAccount.delete({ where: { id: accountId } });
  return ok({ deleted: true });
}
