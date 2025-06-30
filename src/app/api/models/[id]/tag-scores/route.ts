import { NextRequest, NextResponse } from "next/server";

import { getModelTagScores, getTagLeaderboard } from "@/lib/elo";
import { getTagInfo } from "@/lib/tag-taxonomy";

/**
 * GET /api/models/[id]/tag-scores
 *
 * Returns all tag-specific ELO scores for a model.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: modelId } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") ? parseInt(searchParams.get("level")!, 10) : undefined;
    const minMatches = searchParams.get("minMatches")
      ? parseInt(searchParams.get("minMatches")!, 10)
      : 0;

    // Validate level parameter
    if (level !== undefined && ![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { error: "Invalid level parameter (must be 1, 2, or 3)" },
        { status: 400 },
      );
    }

    // Get tag scores
    let tagScores = await getModelTagScores(modelId);

    // Filter by level if specified
    if (level !== undefined) {
      tagScores = tagScores.filter((score) => {
        const tagInfo = getTagInfo(score.tagId);
        return tagInfo && getTagLevel(tagInfo) === level;
      });
    }

    // Filter by minimum matches
    if (minMatches > 0) {
      tagScores = tagScores.filter((score) => score.matchesPlayed >= minMatches);
    }

    // Enhance with tag information and calculate percentiles
    const enhancedScores = await Promise.all(
      tagScores.map(async (score) => {
        const tagInfo = getTagInfo(score.tagId);

        // Get tag leaderboard to calculate rank and percentile
        const tagLeaderboard = await getTagLeaderboard(score.tagId, { limit: 1000 });
        const rank = tagLeaderboard.models.findIndex((m) => m.modelId === modelId) + 1;
        const totalModels = tagLeaderboard.pagination.total;
        const percentile = totalModels > 0 ? Math.round((1 - (rank - 1) / totalModels) * 100) : 0;

        return {
          ...score,
          tagName: tagInfo?.name || score.tagId,
          tagLevel: tagInfo ? getTagLevel(tagInfo) : 0,
          parentTagId: tagInfo?.parentId,
          rank: rank || 999,
          totalModelsForTag: totalModels,
          percentile,
        };
      }),
    );

    // Calculate summary statistics
    const summary =
      enhancedScores.length > 0
        ? {
            totalTags: enhancedScores.length,
            strongestTag: enhancedScores.reduce((best, current) =>
              current.percentile > best.percentile ? current : best,
            ),
            weakestTag: enhancedScores.reduce((worst, current) =>
              current.percentile < worst.percentile ? current : worst,
            ),
            averageElo: Math.round(
              enhancedScores.reduce((sum, score) => sum + score.eloScore, 0) /
                enhancedScores.length,
            ),
            totalMatches: enhancedScores.reduce((sum, score) => sum + score.matchesPlayed, 0),
          }
        : {
            totalTags: 0,
            strongestTag: null,
            weakestTag: null,
            averageElo: 0,
            totalMatches: 0,
          };

    return NextResponse.json({
      modelId,
      modelName: getModelDisplayName(modelId),
      provider: getModelProvider(modelId),
      tagScores: enhancedScores,
      summary,
    });
  } catch (error) {
    console.error("Model tag scores API error:", error);
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
