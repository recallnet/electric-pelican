/**
 * @file Admin Models API
 * @description API endpoints for admin model management
 */

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { withAdminRoute } from "@/lib/auth/admin-protection";
import type { AuthenticatedUser } from "@/types/auth";

import { db } from "../../../../../db";
import { models } from "../../../../../db/schema";

/**
 * Get all unavailable models
 */
async function getUnavailableModelsHandler(
  _request: NextRequest,
  { user: _user }: { user: AuthenticatedUser },
): Promise<NextResponse> {
  try {
    const unavailableModels = await db
      .select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        failure_count: models.failure_count,
        marked_unavailable_at: models.marked_unavailable_at,
        unavailable_reason: models.unavailable_reason,
        last_failure_at: models.last_failure_at,
      })
      .from(models)
      .where(eq(models.is_available, false))
      .orderBy(models.marked_unavailable_at);

    return NextResponse.json({
      models: unavailableModels,
      total: unavailableModels.length,
    });
  } catch (error) {
    console.error("[admin] Error fetching unavailable models:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

/**
 * Toggle model availability
 */
async function toggleModelAvailabilityHandler(
  request: NextRequest,
  { user }: { user: AuthenticatedUser },
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { modelId, makeAvailable } = body;

    if (!modelId || typeof makeAvailable !== "boolean") {
      return NextResponse.json(
        { error: "modelId and makeAvailable are required" },
        { status: 400 },
      );
    }

    const now = new Date();

    if (makeAvailable) {
      // Mark model as available
      await db
        .update(models)
        .set({
          is_available: true,
          failure_count: 0,
          last_failure_at: null,
          unavailable_reason: `Manually restored by admin ${user.email}`,
          marked_unavailable_at: null,
        })
        .where(eq(models.id, modelId));
    } else {
      // Mark model as unavailable
      await db
        .update(models)
        .set({
          is_available: false,
          unavailable_reason: `Manually disabled by admin ${user.email}`,
          marked_unavailable_at: now,
        })
        .where(eq(models.id, modelId));
    }

    console.log(
      `[admin] Model ${modelId} ${makeAvailable ? "enabled" : "disabled"} by ${user.email}`,
    );

    return NextResponse.json({
      success: true,
      message: `Model ${makeAvailable ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    console.error("[admin] Error toggling model availability:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

/**
 * GET /api/admin/models - Get all unavailable models
 */
export const GET = withAdminRoute(getUnavailableModelsHandler);

/**
 * POST /api/admin/models - Toggle model availability
 */
export const POST = withAdminRoute(toggleModelAvailabilityHandler);
