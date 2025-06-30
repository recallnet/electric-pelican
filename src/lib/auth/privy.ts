import { initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { PrivyJWTPayload, PrivyUser, UserProfileData } from "@/types/auth";

// Type definitions have been moved to types/auth.ts

const PRIVY_ISSUER = "privy.io";

/**
 * Generate a consistent avatar from a display name using DiceBear
 */
function generateAvatar(displayName: string): string {
  const avatar = createAvatar(initials, {
    seed: displayName,
    backgroundColor: ["b6e3f4", "c4b5fd", "a78bfa", "fb7185", "fdba74"],
    size: 32,
  });

  return avatar.toString();
}

/**
 * Extract username portion from email address
 */
function extractUsernameFromEmail(email: string): string {
  return email.split("@")[0]!.replace(/[._]/g, " ");
}

/**
 * Extract comprehensive profile data from Privy user object
 * Priority order: GitHub > Google > Email
 */
export function extractUserProfileData(privyUser: PrivyUser): UserProfileData {
  // GitHub OAuth - provides direct avatar URLs
  if (privyUser.github) {
    const displayName = privyUser.github.name || privyUser.github.username || "GitHub User";
    return {
      displayName,
      avatarUrl: privyUser.github.username
        ? `https://github.com/${privyUser.github.username}.png`
        : generateAvatar(displayName),
      provider: "github",
      providerUsername: privyUser.github.username,
    };
  }

  // Google OAuth - use display name, generate avatar
  if (privyUser.google) {
    const displayName = privyUser.google.name || "Google User";
    return {
      displayName,
      avatarUrl: generateAvatar(displayName),
      provider: "google",
      providerUsername: privyUser.google.email?.split("@")[0] || undefined,
    };
  }

  // Email authentication - derive display name from email
  if (privyUser.email?.address) {
    const email = privyUser.email.address;
    const displayName = extractUsernameFromEmail(email);
    return {
      displayName,
      avatarUrl: generateAvatar(displayName),
      provider: "email",
      providerUsername: displayName,
    };
  }

  return {};
}

/**
 * Verify a Privy access token.
 * 1. If `PRIVY_JWKS_ENDPOINT` is defined, verify using JWKS (RS256, production).
 * 2. Else fall back to HMAC verification using `PRIVY_APP_SECRET` (HS256, dev).
 *
 * On success returns the decoded JWT payload typed as `PrivyJWTPayload`.
 * Throws if the token is invalid or expired.
 */
export async function verifyPrivyToken(token: string): Promise<PrivyJWTPayload> {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID env var not set");
  }

  const jwksEndpoint = process.env.PRIVY_JWKS_ENDPOINT;
  if (jwksEndpoint) {
    const jwks = createRemoteJWKSet(new URL(jwksEndpoint));
    const { payload } = await jwtVerify<PrivyJWTPayload>(token, jwks, {
      issuer: PRIVY_ISSUER,
      audience: appId,
    });
    return payload;
  }

  const secret = process.env.PRIVY_APP_SECRET;
  if (!secret) {
    throw new Error("Either PRIVY_JWKS_ENDPOINT or PRIVY_APP_SECRET must be set");
  }

  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify<PrivyJWTPayload>(token, key, {
    issuer: PRIVY_ISSUER,
    audience: appId,
  });
  return payload;
}

// Type imports for DB objects

import type { DbLoaded } from "@/types/auth";

// Helper cached dynamic db load to avoid bundling Node modules in edge runtime

let dbLoaded: DbLoaded | null = null;
async function loadDb() {
  if (!dbLoaded) {
    const mod = await import("../../../db");
    const { eq } = await import("drizzle-orm");
    dbLoaded = { db: mod.db, schema: mod.schema, eq };
  }
  return dbLoaded;
}

export async function getAuthenticatedUser(request: {
  headers?: Headers;
  cookies?: { get: (name: string) => { value: string } | undefined };
}): Promise<PrivyJWTPayload | null> {
  let token: string | undefined;

  // 1. Bearer auth header
  const authHeader =
    request.headers?.get?.("authorization") ?? request.headers?.get?.("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // 2. Cookie
  if (!token) {
    token =
      request.cookies?.get?.("privy-token")?.value ||
      request.headers
        ?.get?.("cookie")
        ?.split("; ")
        .find((c) => c.startsWith("privy-token="))
        ?.split("=")[1];
  }

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyPrivyToken(token);

    // Ensure user row exists (FK for tournaments)
    try {
      const dbResult = await loadDb();
      if (!dbResult) {
        throw new Error("Failed to load database");
      }
      const { db, schema, eq } = dbResult;
      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, payload.sub))
        .limit(1);

      if (existing.length === 0) {
        // Extract display name from email if available
        const displayName = payload.email ? extractUsernameFromEmail(payload.email) : "";

        await db.insert(schema.users).values({
          id: payload.sub,
          privyId: payload.sub,
          email: payload.email ?? null,
          name: displayName,
          displayName: displayName || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.error("ensureUserExists error", err);
    }

    return payload;
  } catch (error) {
    console.error("Privy auth verification failed:", error);

    if (process.env.NODE_ENV === "development") {
      try {
        const middle = token!.split(".")[1] ?? "";
        const payloadRaw = JSON.parse(atob(middle));
        return payloadRaw as PrivyJWTPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}
