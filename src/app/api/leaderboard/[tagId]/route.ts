import { NextRequest, NextResponse } from "next/server";

import { getTagLeaderboard } from "@/lib/elo";
import { getTagInfo, getTagLineage } from "@/lib/tag-taxonomy";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * GET /api/leaderboard/[tagId]
 *
 * Returns leaderboard for a specific capability tag.
 * Supports same query parameters as global leaderboard.
 */
export async function GET(
  request: NextRequest,
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const options = {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
      sortBy:
        (searchParams.get("sortBy") as "eloScore" | "winRate" | "matchesPlayed") || "eloScore",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
    };

    // Validate parameters
    if (isNaN(options.page) || options.page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    if (isNaN(options.limit) || options.limit < 1 || options.limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be 1-100)" },
        { status: 400 },
      );
    }

    // Get leaderboard data
    const leaderboard = await getTagLeaderboard(tagId as HierarchicalTagId, options);

    // Enhance response with tag lineage and additional metadata
    const lineage = getTagLineage(tagId);
    const enhancedResponse = {
      tag: {
        id: tagId,
        name: tagInfo.name,
        description: tagInfo.description,
        level: getTagLevel(tagInfo),
        parentId: tagInfo.parentId,
        lineage: lineage.map((tag: { id: string; name: string }) => ({
          id: tag.id,
          name: tag.name,
        })),
      },
      models: leaderboard.models.map((model) => ({
        modelId: model.modelId,
        globalScore: model.eloScore, // Map eloScore to globalScore for LeaderboardTable compatibility
        matchesPlayed: model.matchesPlayed,
        wins: model.wins,
        losses: model.losses,
        winRate: model.winRate,
        rank: model.rank,
        lastActive: model.lastActive,
        modelName: getModelDisplayName(model.modelId),
        provider: getModelProvider(model.modelId),
        change24h: 0, // TODO: Implement change tracking
        change7d: 0, // TODO: Implement change tracking
      })),
      pagination: leaderboard.pagination,
      stats: {
        totalModels: leaderboard.pagination.total,
        activeLast7Days: leaderboard.models.filter(
          (m) => new Date(m.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).length,
        averageElo: Math.round(
          leaderboard.models.reduce((sum, m) => sum + m.eloScore, 0) /
            Math.max(leaderboard.models.length, 1),
        ),
        // Use a conservative estimate: average matches per model for this tag
        totalMatches:
          leaderboard.models.length > 0
            ? Math.round(
                leaderboard.models.reduce((sum, m) => sum + m.matchesPlayed, 0) /
                  leaderboard.models.length,
              )
            : 0,
      },
    };

    return NextResponse.json(enhancedResponse);
  } catch (error) {
    console.error("Tag leaderboard API error:", error);
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

/**
 * Extract display name from model ID.
 */
function getModelDisplayName(modelId: string): string {
  // Extract readable name from OpenRouter model ID
  const parts = modelId.split("/");
  const modelName = parts[parts.length - 1] || modelId;

  // Convert kebab-case to Title Case
  return modelName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Extract provider from model ID.
 */
function getModelProvider(modelId: string): string {
  const parts = modelId.split("/");
  return parts[0] || "unknown";
}
