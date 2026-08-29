import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const SESSION_COOKIE = "figureforge_session";

export type SessionPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
  [key: string]: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
}) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return token;
}

export async function getSessionUser() {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return { ...user, role: user.role as "USER" | "ADMIN" };
}

export async function getSessionUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return { ...user, role: user.role as "USER" | "ADMIN" };
}

export function setSessionCookie(token: string) {
  const store = cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  const store = cookies();
  store.delete(SESSION_COOKIE);
}
