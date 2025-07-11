/**
 * @file Admin Route Protection
 * @description Provides admin authentication for API routes and pages
 */

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import type { AuthenticatedUser, ProtectedRouteHandler } from "@/types/auth";

import { db } from "../../../db";
import { admins } from "../../../db/schema";
import { getAuthenticatedUser } from "./privy";

/**
 * Check if a user is an admin by email
 * @param email - User's email address
 * @returns Promise<boolean> - True if user is admin
 */
export async function isAdmin(email: string): Promise<boolean> {
  if (!email) return false;

  try {
    const adminUser = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

    return adminUser.length > 0;
  } catch (error) {
    console.error("[admin] Error checking admin status:", error);
    return false;
  }
}

/**
 * Middleware that protects admin routes with both authentication and admin authorization
 * @param handler - The admin route handler to protect
 * @returns Protected admin route handler
 */
export function withAdminRoute(handler: ProtectedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // First check authentication
      const payload = await getAuthenticatedUser(request);

      if (!payload) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get user email from JWT payload or database
      let userEmail = payload.email;

      // If no email in JWT, look up user in database
      if (!userEmail) {
        try {
          const { users } = await import("../../../db/schema");
          const userRecord = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, payload.sub))
            .limit(1);

          if (userRecord.length > 0) {
            userEmail = userRecord[0]?.email || undefined;
          }
        } catch (error) {
          console.error("[admin] Error fetching user email:", error);
        }
      }

      // Check if user is admin
      if (!userEmail || !(await isAdmin(userEmail))) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      // Construct user object with admin privileges
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: userEmail,
      };

      // Call the protected handler with user context
      return handler(request, { user });
    } catch (error) {
      console.error("[admin] Admin verification failed:", error);
      return NextResponse.json({ error: "Admin verification failed" }, { status: 403 });
    }
  };
}

/**
 * Check if current user has admin privileges (for client-side use)
 * @param request - Next.js request object
 * @returns Promise<boolean> - True if user is admin
 */
export async function checkAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    const payload = await getAuthenticatedUser(request);
    if (!payload?.email) return false;
    return await isAdmin(payload.email);
  } catch (error) {
    console.error("[admin] Admin access check failed:", error);
    return false;
  }
}
