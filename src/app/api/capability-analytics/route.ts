import { NextResponse } from "next/server";

import { getCapabilityCoverage } from "@/lib/capability-analytics";

export const runtime = "nodejs";

/**
 * GET /api/capability-analytics
 * Returns comprehensive capability coverage statistics and analytics
 */
export async function GET() {
  try {
    const coverage = await getCapabilityCoverage();

    return NextResponse.json({
      success: true,
      data: coverage,
    });
  } catch (error) {
    console.error("Capability analytics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch capability analytics",
      },
      { status: 500 },
    );
  }
}
