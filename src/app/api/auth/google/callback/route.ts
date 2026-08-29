import { NextRequest } from "next/server";
import { verifyOAuthState, exchangeGoogleCode, findOrCreateSocialUser, linkSocialAccount, createMergeIntent } from "@/lib/oauth";

const BASE = process.env.APP_URL || "https://figureforge.ir";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
  }

  const payload = await verifyOAuthState(state);
  if (!payload || payload.provider !== "google") {
    return Response.redirect(new URL("/fa/auth?error=invalid_state", BASE));
  }

  try {
    const info = await exchangeGoogleCode(code);
    if (!info) {
      return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
    }

    if (payload.mode === "link" && payload.linkUserId) {
      const result = await linkSocialAccount(info, "google", payload.linkUserId);

      if (result.status === "linked" || result.status === "already_linked") {
        const redirectUrl = new URL(payload.redirect || "/", BASE);
        redirectUrl.searchParams.set("linked", result.status === "linked" ? "ok" : "already");
        return Response.redirect(redirectUrl);
      }

      if (result.status === "conflict" && result.conflict) {
        const mergeToken = await createMergeIntent(
          payload.linkUserId,
          result.conflict.socialAccountId,
        );
        const redirectUrl = new URL(payload.redirect || "/", BASE);
        redirectUrl.searchParams.set("merge", "1");
        redirectUrl.searchParams.set("mergeToken", mergeToken);
        redirectUrl.searchParams.set("provider", "google");
        if (result.conflict.otherName) redirectUrl.searchParams.set("otherName", result.conflict.otherName);
        if (result.conflict.otherEmail) redirectUrl.searchParams.set("otherEmail", result.conflict.otherEmail);
        if (result.conflict.otherPhone) redirectUrl.searchParams.set("otherPhone", result.conflict.otherPhone);
        if (result.conflict.otherAvatar) redirectUrl.searchParams.set("otherAvatar", result.conflict.otherAvatar);
        return Response.redirect(redirectUrl);
      }
    }

    const cartToken = req.cookies.get("cart_token")?.value ?? null;
    await findOrCreateSocialUser(info, "google", cartToken);

    return Response.redirect(new URL(payload.redirect || "/", BASE));
  } catch {
    return Response.redirect(new URL("/fa/auth?error=oauth_failed", BASE));
  }
}
