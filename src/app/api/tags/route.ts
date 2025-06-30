/**
 * @file API endpoint for hierarchical taxonomy tags
 * @description Provides access to the complete AI capability taxonomy
 */

import { NextResponse } from "next/server";

import { TAGS } from "@/lib/tag-taxonomy";

/**
 * GET /api/tags - Returns the complete hierarchical taxonomy
 * @description Provides the full AI capability taxonomy including all levels
 * (pillars, families, and leaf tags) with their relationships and metadata.
 * This endpoint is used by frontend components to build tag selectors,
 * display tag hierarchies, and validate tag operations.
 * @returns The complete taxonomy with all tag information
 */
export async function GET() {
  try {
    return NextResponse.json({
      tags: TAGS,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
