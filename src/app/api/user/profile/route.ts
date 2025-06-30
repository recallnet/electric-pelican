import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { extractUserProfileData, getAuthenticatedUser } from "@/lib/auth/privy";

import { db, schema } from "../../../../../db";

export const runtime = "nodejs";

/**
 * Update user profile data with information from Privy user object.
 * Called from frontend when full user object is available.
 */
export async function POST(request: NextRequest) {
  console.log("=== User Profile API Called ===");
  console.log("Request method:", request.method);
  console.log("Content-Type:", request.headers.get("content-type"));
  console.log("Request URL:", request.url);
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Verify authentication
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      console.log("Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated user:", authUser.sub);

    // Get Privy user object from request body with robust error handling
    let body = {};
    let bodyText = "";

    try {
      bodyText = await request.text();
      console.log("Request body received, length:", bodyText?.length || 0);

      // Check if body is empty
      if (!bodyText || bodyText.trim() === "") {
        console.warn("Empty request body received for user profile update");
        return NextResponse.json({ error: "Empty request body" }, { status: 400 });
      }

      // Try to parse JSON
      body = JSON.parse(bodyText);
      console.log("JSON parsed successfully, keys:", Object.keys(body));
    } catch (error) {
      console.error("Failed to parse request body:", error);
      console.error("Request body length:", bodyText?.length || 0);
      console.error("Request body preview:", bodyText?.substring(0, 100) || "empty");
      return NextResponse.json({ error: "Invalid request body - not valid JSON" }, { status: 400 });
    }

    const { privyUser } = body as { privyUser?: any };

    if (!privyUser) {
      console.warn("Missing privyUser in request body");
      return NextResponse.json({ error: "Missing privyUser in request body" }, { status: 400 });
    }

    console.log("privyUser received, id:", privyUser.id);

    // Extract profile data
    const profileData = extractUserProfileData(privyUser);
    console.log("Profile data extracted:", profileData);

    // Update user record
    await db
      .update(schema.users)
      .set({
        displayName: profileData.displayName || null,
        avatarUrl: profileData.avatarUrl || null,
        provider: profileData.provider || null,
        providerUsername: profileData.providerUsername || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, authUser.sub));

    console.log("User profile updated successfully");

    return NextResponse.json({
      success: true,
      profileData: {
        displayName: profileData.displayName,
        avatarUrl: profileData.avatarUrl,
        provider: profileData.provider,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
