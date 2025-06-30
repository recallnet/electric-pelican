import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/privy";
import { getCompleteTournamentData } from "@/lib/tournament-db";
import { Tournament } from "@/types/tournament";

export const runtime = "nodejs";

/**
 * GET /api/tournament/[id]/results
 * Returns complete tournament data including metadata and latest run results.
 * Used for public viewing of tournament results.
 */
export async function GET(
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

    // Get requesting user ID for upvote status (optional)
    let requestingUserId: string | undefined;
    try {
      const user = await getAuthenticatedUser(request);
      requestingUserId = user?.sub;
    } catch {
      // Not authenticated, continue without user context
    }

    const tournamentData = await getCompleteTournamentData(id, requestingUserId);

    if (!tournamentData || !tournamentData.tournament) {
      return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
    }

    const t = tournamentData.tournament as Tournament;

    // Return comprehensive tournament results
    return NextResponse.json({
      success: true,
      data: {
        tournament: {
          id: t.id,
          slug: t.slug,
          title: t.title,
          prompt: t.prompt,
          judgePrompt: t.judgePrompt,
          models: t.models,
          judgeModel: t.judgeModel,
          bracketSize: t.bracketSize,
          createdAt: t.createdAt,
          createdBy: t.createdBy,
          authorName: t.authorName,
          upvoteCount: t.upvoteCount,
          hasUpvoted: t.hasUpvoted,
          parentId: t.parentId,
          forkCount: t.forkCount,
          tags: t.tags,
        },
        run: tournamentData.run
          ? {
              id: tournamentData.run.id,
              status: tournamentData.run.status,
              winnerModel: tournamentData.run.winnerModel,
              startedAt: tournamentData.run.startedAt,
              completedAt: tournamentData.run.completedAt,
            }
          : null,
        bracket: tournamentData.bracket,
      },
    });
  } catch (error) {
    console.error("Error fetching tournament results:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
