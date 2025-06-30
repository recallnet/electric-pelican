import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/privy";
import {
  getTournamentUpvoteCount,
  toggleTournamentUpvote,
  tournamentExists,
} from "@/lib/tournament-db";

export const runtime = "nodejs";

/**
 * POST /api/tournament/[id]/upvote
 * Toggles upvote for a tournament by the authenticated user.
 * Returns the new upvote state and total count.
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

    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Toggle upvote
    const hasUpvoted = await toggleTournamentUpvote(id, user.sub);

    // Get updated upvote count
    const upvoteCount = await getTournamentUpvoteCount(id);

    return NextResponse.json({
      success: true,
      hasUpvoted,
      upvoteCount,
    });
  } catch (error) {
    console.error("Error toggling tournament upvote:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
