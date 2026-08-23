import { NextRequest, NextResponse } from "next/server";
import { locales, isLocale, defaultLocale } from "@/lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API, static files, docs
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1];
  const hasLocale = isLocale(firstSegment);

  // Rewrite unprefixed paths to the default (Farsi) locale tree
  const response = hasLocale
    ? NextResponse.next()
    : (() => {
        const url = req.nextUrl.clone();
        url.pathname = `/${defaultLocale}${pathname}`;
        return NextResponse.rewrite(url);
      })();

  const locale = hasLocale ? (firstSegment as (typeof locales)[number]) : defaultLocale;
  response.cookies.set("locale", locale, { path: "/" });
  response.headers.set("x-pathname", pathname);

  // Anonymous visitor UID so reactions/analytics can identify guests.
  if (!req.cookies.get("ff_vid")?.value) {
    response.cookies.set("ff_vid", crypto.randomUUID(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
      sameSite: "lax",
      httpOnly: true,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
