/**
 * @file Route Protection Middleware
 * @description Provides authentication protection for API routes using Privy JWT validation
 */

import { NextRequest, NextResponse } from "next/server";

import { AuthenticatedUser, ProtectedRouteHandler } from "@/types/auth";

import { getAuthenticatedUser } from "./privy";

/**
 * Middleware that protects API routes with Privy authentication
 * @param handler - The route handler to protect
 * @returns Protected route handler
 */
export function withProtectedRoute(handler: ProtectedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use existing authentication helper
      const payload = await getAuthenticatedUser(request);

      if (!payload) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Construct user object from payload
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
      };

      // Call the protected handler with user context
      return handler(request, { user });
    } catch (error) {
      console.error("[auth] Token verification failed:", error);

      return NextResponse.json({ error: "Authentication verification failed" }, { status: 401 });
    }
  };
}

/**
 * Extract user from request for client-side components
 * @param request - Next.js request object
 * @returns User object or null
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const payload = await getAuthenticatedUser(request);

    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  } catch (error) {
    console.error("[auth] User extraction failed:", error);
    return null;
  }
}
