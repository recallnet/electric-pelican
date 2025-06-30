import { NextRequest, NextResponse } from "next/server";

import { createTournamentVersion, tournamentExists } from "@/lib/tournament-db";
import { VersionRequest } from "@/types/app";

export const runtime = "nodejs";

/**
 * POST /api/tournament/[id]/version
 * Creates a new version of an existing tournament with the same configuration.
 */
export async function POST(
  request: NextRequest,
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

    const body: VersionRequest = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const newTournamentId = await createTournamentVersion(id, userId);

    return NextResponse.json({
      success: true,
      data: {
        id: newTournamentId,
        message: "Tournament version created successfully",
      },
    });
  } catch (error) {
    console.error("Error creating tournament version:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
