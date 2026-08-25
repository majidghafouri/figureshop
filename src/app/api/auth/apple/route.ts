import { NextRequest } from "next/server";
import { getAppleAuthUrl, createOAuthState } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const state = await createOAuthState("apple", req.nextUrl.searchParams.get("next") ?? "/");
  const url = getAppleAuthUrl(state);
  return Response.redirect(url);
}
