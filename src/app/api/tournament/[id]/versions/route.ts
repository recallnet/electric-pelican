import { NextRequest, NextResponse } from "next/server";

import { getTournamentVersions, tournamentExists } from "@/lib/tournament-db";

export const runtime = "nodejs";

/**
 * GET /api/tournament/[id]/versions
 * Returns all versions of a tournament (same parent lineage).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tournament ID is required" },
        { status: 400 },
      );
    }

    // Check if tournament exists
    const exists = await tournamentExists(id);
    if (!exists) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const versions = await getTournamentVersions(id);

    return NextResponse.json({
      success: true,
      data: {
        versions: versions.map((version) => ({
          id: version.id,
          slug: version.slug,
          title: version.title,
          createdAt: version.createdAt,
          parentId: version.parentId,
          forkCount: version.forkCount,
        })),
        total: versions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching tournament versions:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
