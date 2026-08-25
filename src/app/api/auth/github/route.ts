import { NextRequest } from "next/server";
import { getGitHubAuthUrl, createOAuthState } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const state = await createOAuthState("github", req.nextUrl.searchParams.get("next") ?? "/");
  const url = getGitHubAuthUrl(state);
  return Response.redirect(url);
}
