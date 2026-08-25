import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: user.id },
    select: { id: true, provider: true, name: true, email: true, avatar: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return ok({ accounts });
}
