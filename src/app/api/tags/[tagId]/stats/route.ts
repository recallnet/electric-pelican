import { NextRequest, NextResponse } from "next/server";

import { getTagLeaderboard } from "@/lib/elo";
import { getTagInfo } from "@/lib/tag-taxonomy";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * GET /api/tags/[tagId]/stats
 *
 * Returns aggregate statistics for a specific tag across all models.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    const { tagId } = await params;

    // Validate tag exists in taxonomy
    const tagInfo = getTagInfo(tagId);
    if (!tagInfo) {
      return NextResponse.json(
        {
          error: `Tag '${tagId}' not found in taxonomy`,
          availableTags: "/api/tags",
        },
        { status: 404 },
      );
    }

    // Get comprehensive leaderboard data (up to 1000 models)
    const leaderboard = await getTagLeaderboard(tagId as HierarchicalTagId, { limit: 1000 });
    const models = leaderboard.models;

    if (models.length === 0) {
      return NextResponse.json({
        tag: {
          id: tagId,
          name: tagInfo.name,
          level: getTagLevel(tagInfo),
        },
        stats: {
          totalModels: 0,
          totalMatches: 0,
          averageElo: 0,
          medianElo: 0,
          eloRange: { min: 0, max: 0 },
          activeLast7Days: 0,
          activeLast30Days: 0,
          topPerformers: [],
          recentTournaments: 0,
          growthStats: {
            newModelsLast7Days: 0,
            matchesLast7Days: 0,
          },
        },
      });
    }

    // Calculate statistics
    const eloScores = models.map((m) => m.eloScore).sort((a, b) => a - b);
    const totalMatches = models.reduce((sum, m) => sum + m.matchesPlayed, 0);
    const averageElo = Math.round(models.reduce((sum, m) => sum + m.eloScore, 0) / models.length);

    const medianElo = Math.round(
      eloScores.length % 2 === 0
        ? (eloScores[eloScores.length / 2 - 1]! + eloScores[eloScores.length / 2]!) / 2
        : eloScores[Math.floor(eloScores.length / 2)]!,
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeLast7Days = models.filter((m) => new Date(m.lastActive) > sevenDaysAgo).length;

    const activeLast30Days = models.filter((m) => new Date(m.lastActive) > thirtyDaysAgo).length;

    // Top performers (top 5)
    const topPerformers = models.slice(0, 5).map((m) => ({
      modelId: m.modelId,
      eloScore: m.eloScore,
    }));

    const stats = {
      totalModels: models.length,
      totalMatches,
      averageElo,
      medianElo,
      eloRange: {
        min: Math.min(...eloScores),
        max: Math.max(...eloScores),
      },
      activeLast7Days,
      activeLast30Days,
      topPerformers,
      recentTournaments: 0, // TODO: Implement tournament counting
      growthStats: {
        newModelsLast7Days: 0, // TODO: Implement new model tracking
        matchesLast7Days: 0, // TODO: Implement recent match counting
      },
    };

    return NextResponse.json({
      tag: {
        id: tagId,
        name: tagInfo.name,
        level: getTagLevel(tagInfo),
      },
      stats,
    });
  } catch (error) {
    console.error("Tag stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get the hierarchical level of a tag (1, 2, or 3).
 */
function getTagLevel(tagInfo: { parentId?: string | undefined }): number {
  if (!tagInfo.parentId) return 1; // L1 pillar

  // Check if parent has a parent (L3 leaf)
  const parentInfo = getTagInfo(tagInfo.parentId);
  if (parentInfo?.parentId) return 3; // L3 leaf

  return 2; // L2 family
}
