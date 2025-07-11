/**
 * Auth-related type definitions
 */
import { JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";

import type { DrizzleInstance, Schema } from "@/types/db";

/**
 * Minimal shape of Privy JWT payload.
 * See https://docs.privy.io/authentication/user-authentication/access-tokens
 */
export interface PrivyJWTPayload extends JWTPayload {
  sub: string; // Privy user id
  email?: string;
}

/**
 * Enhanced user profile data extracted from Privy user object
 */
export interface UserProfileData {
  displayName?: string | undefined;
  avatarUrl?: string | undefined;
  provider?: string | undefined;
  providerUsername?: string | undefined;
}

/**
 * Shape of a Privy user object with minimal required fields
 */
export interface PrivyUser {
  github?: {
    name?: string;
    username?: string;
  };
  google?: {
    name: string;
    email?: string;
  };
  email?: {
    address: string;
    verified?: boolean;
  };
}

/**
 * Helper cached dynamic db load to avoid bundling Node modules in edge runtime
 */
export interface DbLoaded {
  db: DrizzleInstance;
  schema: Schema;
  eq: typeof import("drizzle-orm").eq;
}

/**
 * User type for authenticated requests
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  wallet?: string;
}

/**
 * Handler type for protected routes
 */
export type ProtectedRouteHandler = (
  request: NextRequest,
  context: { user: AuthenticatedUser },
) => Promise<NextResponse>;
