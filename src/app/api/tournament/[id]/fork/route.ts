import { NextResponse } from "next/server";

import { forkTournament, tournamentExists } from "@/lib/tournament-db";
import { ForkRequest } from "@/types/api";

export const runtime = "nodejs";

/**
 * POST /api/tournament/[id]/fork
 * Creates a fork of an existing tournament with the same configuration.
 */
export async function POST(
  request: Request,
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

    const body: ForkRequest = await request.json();
    const { userId, title } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const newTournamentId = await forkTournament(id, userId, title);

    return NextResponse.json({
      success: true,
      data: {
        id: newTournamentId,
        message: "Tournament forked successfully",
      },
    });
  } catch (error) {
    console.error("Error forking tournament:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
