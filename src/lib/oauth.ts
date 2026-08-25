import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "figureforge-dev-secret-change-in-production"
);

export type OAuthProvider = "google" | "github" | "apple" | "telegram";

export interface OAuthState {
  provider: OAuthProvider;
  redirect?: string;
  nonce?: string;
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
  redirect?: string
): Promise<string> {
  return new SignJWT({ provider, redirect })
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

// ---------- Apple ----------

const APPLE_CONFIG = {
  authUrl: "https://appleid.apple.com/auth/authorize",
  tokenUrl: "https://appleid.apple.com/auth/token",
};

export function getAppleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/apple/callback`,
    response_type: "code id_token",
    scope: "name email",
    state,
    response_mode: "query",
  });
  return `${APPLE_CONFIG.authUrl}?${params}`;
}

async function generateAppleClientSecret(): Promise<string> {
  const { importPKCS8 } = await import("jose");
  const privateKey = await importPKCS8(process.env.APPLE_PRIVATE_KEY!, "ES256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt(now)
    .setExpirationTime("6m")
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .sign(privateKey);
  return jwt;
}

export async function exchangeAppleCode(
  code: string,
  idToken: string
): Promise<OAuthUserInfo | null> {
  const clientSecret = await generateAppleClientSecret();
  const res = await fetch(APPLE_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      redirect_uri: `${process.env.APP_URL || "https://figureforge.ir"}/api/auth/apple/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;

  const { payload } = await jwtVerify(idToken, new TextEncoder().encode(""), {
    algorithms: ["RS256"],
  }).catch(async () => {
    const jwksRes = await fetch("https://appleid.apple.com/auth/keys");
    const { keys } = await jwksRes.json();
    const header = JSON.parse(Buffer.from(idToken.split(".")[0], "base64url").toString());
    const key = keys.find((k: { kid: string }) => k.kid === header.kid);
    if (!key) throw new Error("No matching key");
    const { importJWK } = await import("jose");
    const publicKey = await importJWK(key, "RS256");
    return jwtVerify(idToken, publicKey, { algorithms: ["RS256"] });
  });

  const sub = payload.sub as string;
  const email = (payload.email as string) ?? null;

  return {
    providerId: sub,
    email,
    name: null,
    avatar: null,
  };
}

// ---------- Telegram ----------

export async function verifyTelegramAuth(data: Record<string, string>): Promise<boolean> {
  const botToken = process.env.TELEGRAM_LOGIN_BOT_TOKEN;
  if (!botToken) return false;

  const { hash, ...rest } = data;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const encoder = new TextEncoder();
  return crypto.subtle
    .digest("SHA-256", encoder.encode(`WebAppData${botToken}`))
    .then((keyBytes) => {
      const key = crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return key;
    })
    .then((key) =>
      crypto.subtle.sign("HMAC", key, encoder.encode(checkString))
    )
    .then((sig) => {
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hex === hash;
    })
    .catch(() => false);
}

// ---------- Shared: find or create user ----------

import prisma from "@/lib/db";
import { mergeGuestCart } from "@/lib/cart";
import { createSessionCookie, setSessionCookie } from "@/lib/auth";

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
