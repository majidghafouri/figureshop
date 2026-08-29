import { NextRequest } from "next/server";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";
import { createOAuthState, getGoogleAuthUrl, getGitHubAuthUrl, OAuthProvider } from "@/lib/oauth";
import { rateLimitOrFail } from "@/lib/rate-limit";

const BASE = process.env.APP_URL || "https://figureforge.ir";

export async function POST(req: NextRequest) {
  const limiter = rateLimitOrFail(req, 10, 60_000, "social-connect:ip");
  if (!limiter.allowed) return limiter.response;

  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const body = parseJson<{ provider?: OAuthProvider; redirect?: string }>(await req.text());
  const provider = body?.provider;
  if (provider !== "google" && provider !== "github") {
    return fail("invalid_provider");
  }

  const state = await createOAuthState(provider, body?.redirect ?? `${BASE}/${user.locale || "fa"}/account`, "link", user.id);

  const url = provider === "google"
    ? getGoogleAuthUrl(state)
    : getGitHubAuthUrl(state);

  return ok({ url });
}
