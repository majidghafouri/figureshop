import { NextRequest } from "next/server";
import { verifyOAuthState, exchangeAppleCode, findOrCreateSocialUser } from "@/lib/oauth";

const BASE = process.env.APP_URL || "https://figureforge.ir";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const idToken = req.nextUrl.searchParams.get("id_token");

  if (!code || !state) {
    return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
  }

  const payload = await verifyOAuthState(state);
  if (!payload || payload.provider !== "apple") {
    return Response.redirect(new URL("/fa/auth?error=invalid_state", BASE));
  }

  try {
    const info = await exchangeAppleCode(code, idToken || "");
    if (!info) {
      return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
    }

    const cartToken = req.cookies.get("cart_token")?.value ?? null;
    await findOrCreateSocialUser(info, "apple", cartToken);

    return Response.redirect(new URL(payload.redirect || "/", BASE));
  } catch {
    return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
  }
}
