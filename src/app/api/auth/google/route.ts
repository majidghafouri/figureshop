import { NextRequest } from "next/server";
import { getGoogleAuthUrl, createOAuthState } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const state = await createOAuthState("google", req.nextUrl.searchParams.get("next") ?? "/");
  const url = getGoogleAuthUrl(state);
  return Response.redirect(url);
}
