import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "figureforge-dev-secret-change-in-production"
);

export type OAuthProvider = "google" | "github";

export interface OAuthState {
  provider: OAuthProvider;
  redirect?: string;
  nonce?: string;
  mode?: "login" | "link";
  linkUserId?: string;
}

export interface OAuthUserInfo {
  providerId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

// ---------- State (signed JWT, 10 min expiry) ----------

export async function createOAuthState(
  provider: OAuthProvider,
  redirect?: string,
  mode?: "login" | "link",
  linkUserId?: string
): Promise<string> {
  return new SignJWT({ provider, redirect, mode: mode ?? "login", linkUserId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SECRET);
}

export async function verifyOAuthState(
  state: string
): Promise<OAuthState | null> {
  try {
    const { payload } = await jwtVerify(state, SECRET);
    return payload as unknown as OAuthState;
  } catch {
    return null;
  }
}

// ---------- Google ----------

const GOOGLE_CONFIG = {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  scope: "openid email profile",
};

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/google/callback`,
    response_type: "code",
    scope: GOOGLE_CONFIG.scope,
    state,
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_CONFIG.authUrl}?${params}`;
}

export async function exchangeGoogleCode(
  code: string
): Promise<OAuthUserInfo | null> {
  const res = await fetch(GOOGLE_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const { access_token } = await res.json();
  const userRes = await fetch(GOOGLE_CONFIG.userInfoUrl, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return null;
  const data = await userRes.json();
  return {
    providerId: data.id,
    email: data.email ?? null,
    name: data.name ?? null,
    avatar: data.picture ?? null,
  };
}

// ---------- GitHub ----------

const GITHUB_CONFIG = {
  authUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  userInfoUrl: "https://api.github.com/user",
  scope: "user:email",
};

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/github/callback`,
    scope: GITHUB_CONFIG.scope,
    state,
  });
  return `${GITHUB_CONFIG.authUrl}?${params}`;
}

export async function exchangeGitHubCode(
  code: string
): Promise<OAuthUserInfo | null> {
  const res = await fetch(GITHUB_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/github/callback`,
    }),
  });
  if (!res.ok) return null;
  const { access_token } = await res.json();
  const userRes = await fetch(GITHUB_CONFIG.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/json",
    },
  });
  if (!userRes.ok) return null;
  const data = await userRes.json();

  let email = data.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primary = emails.find(
        (e: { primary?: boolean; verified?: boolean }) => e.primary && e.verified
      );
      email = primary?.email ?? emails[0]?.email ?? null;
    }
  }

  return {
    providerId: String(data.id),
    email,
    name: data.name ?? data.login ?? null,
    avatar: data.avatar_url ?? null,
  };
}

// ---------- Shared: find or create user ----------

import prisma from "@/lib/db";
import { mergeGuestCart } from "@/lib/cart";
import { createSessionCookie, setSessionCookie } from "@/lib/auth";

export async function linkSocialAccount(
  info: OAuthUserInfo,
  provider: OAuthProvider,
  linkUserId: string
): Promise<{ status: "linked" | "already_linked" | "conflict"; conflict?: { socialAccountId: string; otherName: string | null; otherEmail: string | null; otherPhone: string | null; otherAvatar: string | null } }> {
  const providerLower = provider.toLowerCase();

  const existing = await prisma.socialAccount.findUnique({
    where: { provider_providerId: { provider: providerLower, providerId: info.providerId } },
    include: { user: true },
  });

  if (existing) {
    if (existing.userId === linkUserId) {
      if (info.name || info.avatar) {
        await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            ...(info.name ? { name: info.name } : {}),
            ...(info.avatar ? { avatar: info.avatar } : {}),
            ...(info.email ? { email: info.email } : {}),
          },
        });
      }
      return { status: "already_linked" };
    }

    return {
      status: "conflict",
      conflict: {
        socialAccountId: existing.id,
        otherName: existing.user.name,
        otherEmail: existing.user.email,
        otherPhone: existing.user.phone,
        otherAvatar: existing.avatar,
      },
    };
  }

  await prisma.socialAccount.create({
    data: {
      userId: linkUserId,
      provider: providerLower,
      providerId: info.providerId,
      email: info.email,
      name: info.name,
      avatar: info.avatar,
    },
  });

  return { status: "linked" };
}

export async function findOrCreateSocialUser(
  info: OAuthUserInfo,
  provider: OAuthProvider,
  cartToken: string | null
) {
  const providerLower = provider.toLowerCase();
  const email = info.email?.toLowerCase() ?? null;

  // 1. Check if social account already linked
  const existing = await prisma.socialAccount.findUnique({
    where: { provider_providerId: { provider: providerLower, providerId: info.providerId } },
    include: { user: true },
  });

  if (existing) {
    // Update name/avatar if changed
    if (info.name || info.avatar) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          ...(info.name ? { name: info.name } : {}),
          ...(info.avatar ? { avatar: info.avatar } : {}),
          ...(info.email ? { email: info.email } : {}),
        },
      });
    }
    const token = await createSessionCookie({
      id: existing.user.id,
      email: existing.user.email ?? email ?? "",
      role: existing.user.role as "USER" | "ADMIN",
    });
    setSessionCookie(token);
    if (existing.user.id && cartToken) {
      await mergeGuestCart(existing.user.id, cartToken);
    }
    return existing.user;
  }

  // 2. Check if user exists with same email
  let user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  // 3. Create new user if needed
  if (!user) {
    const isAdminEmail =
      !!process.env.ADMIN_EMAIL &&
      email === process.env.ADMIN_EMAIL.trim().toLowerCase();

    user = await prisma.user.create({
      data: {
        email,
        name: info.name,
        emailVerified: !!email,
        role: isAdminEmail ? "ADMIN" : "USER",
      },
    });
  } else if (!user.name && info.name) {
    // Update name if user doesn't have one
    await prisma.user.update({
      where: { id: user.id },
      data: { name: info.name },
    });
    user.name = info.name;
  }

  // 4. Link social account
  await prisma.socialAccount.create({
    data: {
      userId: user.id,
      provider: providerLower,
      providerId: info.providerId,
      email: info.email,
      name: info.name,
      avatar: info.avatar,
    },
  });

  // 5. Create session
  const token = await createSessionCookie({
    id: user.id,
    email: user.email ?? email ?? "",
    role: user.role as "USER" | "ADMIN",
  });
  setSessionCookie(token);

  if (user.id && cartToken) {
    await mergeGuestCart(user.id, cartToken);
  }

  return user;
}
