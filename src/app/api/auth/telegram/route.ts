import { NextRequest } from "next/server";
import { verifyTelegramAuth, findOrCreateSocialUser, type OAuthUserInfo } from "@/lib/oauth";
import { ok, fail, parseJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = parseJson<{
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date?: string;
    hash?: string;
  }>(await req.text());

  if (!body?.id || !body?.hash || !body?.auth_date) {
    return fail("missing_parameters");
  }

  // Check auth_date is recent (within 5 minutes)
  const authAge = Math.floor(Date.now() / 1000) - Number(body.auth_date);
  if (authAge > 300) return fail("expired");

  // Verify hash
  const result = await verifyTelegramAuth(body as unknown as Record<string, string>);
  const valid = typeof result === "boolean" ? result : result.ok;
  if (!valid) {
    const debugObj = typeof result === "object" ? result : undefined;
    const tokenSha = debugObj
      ? await crypto.subtle.digest("SHA-256", new TextEncoder().encode(process.env.TELEGRAM_LOGIN_BOT_TOKEN || "")).then(
          (b) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("")
        )
      : "no_token";
    return fail("invalid_hash", 400, {
      ...(debugObj as unknown as Record<string, unknown>),
      tokenSha256: await tokenSha,
    });
  }

  const info: OAuthUserInfo = {
    providerId: String(body.id),
    email: null,
    name: [body.first_name, body.last_name].filter(Boolean).join(" ") || body.username || null,
    avatar: body.photo_url ?? null,
  };

  const cartToken = req.cookies.get("cart_token")?.value ?? null;
  const user = await findOrCreateSocialUser(info, "telegram", cartToken);

  return ok({
    user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
  });
}
