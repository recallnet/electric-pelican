/**
 * @file Hierarchical ELO fallback logic
 * @description Handles hierarchical capability fallback when specific scores are unavailable
 */

import type { EloScore } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { getModelEloScore, getTopModelsForCapability } from "./client";

/**
 * Get hierarchical ELO score by trying parent capabilities when specific score is missing
 * @param modelId - The model ID to look up
 * @param capability - The capability tag ID
 * @returns ELO score with hierarchical fallback metadata or null if no score found
 */
export async function getHierarchicalEloScore(
  modelId: string,
  capability: HierarchicalTagId,
): Promise<EloScore | null> {
  // Import here to avoid circular dependencies
  const { getTagLineage } = await import("../../tag-taxonomy");

  const lineage = getTagLineage(capability);

  // Try from most specific to most general
  for (let i = lineage.length - 1; i >= 0; i--) {
    const tagId = lineage[i]!.id as HierarchicalTagId;

    try {
      const score = await getModelEloScore(modelId, tagId);

      // Only use scores with actual match data
      if (score.matchesPlayed > 0) {
        const fallbackLevel = lineage.length - 1 - i;

        // Adjust confidence based on hierarchical distance
        const adjustedConfidence = adjustConfidenceForHierarchy(score.confidence, fallbackLevel);

        return {
          ...score,
          confidence: adjustedConfidence,
          fallbackLevel,
          originalCapability: capability,
          usedCapability: tagId,
        };
      }
    } catch (error) {
      // Continue to next level in hierarchy
      console.debug(`No ELO score for ${modelId}:${tagId}, trying parent level`);
    }
  }

  return null;
}

/**
 * Adjust confidence based on hierarchical distance from original capability
 * @param originalConfidence - Original confidence score
 * @param fallbackLevel - Number of levels up the hierarchy (0 = exact match)
 * @returns Adjusted confidence score
 */
export function adjustConfidenceForHierarchy(
  originalConfidence: number,
  fallbackLevel: number,
): number {
  if (fallbackLevel === 0) {
    return originalConfidence; // No penalty for exact match
  }

  // Reduce confidence as we go up the hierarchy
  // L3→L2: 80% confidence, L3→L1: 64% confidence
  const hierarchyPenalty = Math.pow(0.8, fallbackLevel);
  return Math.max(0.1, originalConfidence * hierarchyPenalty);
}

/**
 * Get top models for a capability with hierarchical fallback
 * @param tagId - The capability tag ID
 * @param limit - Maximum number of models to return
 * @returns Array of model IDs with their hierarchical ELO scores
 */
export async function getTopModelsForCapabilityHierarchical(
  tagId: HierarchicalTagId,
  limit: number = 10,
): Promise<Array<{ modelId: string; modelName: string; eloScore: EloScore }>> {
  // First try direct capability lookup
  const directResults = await getTopModelsForCapability(tagId, limit);

  if (directResults.length >= limit) {
    return directResults;
  }

  // If we don't have enough results, try hierarchical fallback
  const { getTagLineage } = await import("../../tag-taxonomy");
  const lineage = getTagLineage(tagId);

  const hierarchicalResults = new Map<
    string,
    { modelId: string; modelName: string; eloScore: EloScore }
  >();

  // Add direct results first
  directResults.forEach((result) => {
    hierarchicalResults.set(result.modelId, result);
  });

  // Try parent levels if we need more results
  for (let i = lineage.length - 2; i >= 0 && hierarchicalResults.size < limit; i--) {
    const parentTagId = lineage[i]!.id as HierarchicalTagId;

    try {
      const parentResults = await getTopModelsForCapability(parentTagId, limit);
      const fallbackLevel = lineage.length - 1 - i;

      for (const result of parentResults) {
        if (!hierarchicalResults.has(result.modelId) && hierarchicalResults.size < limit) {
          // Adjust confidence for hierarchical fallback
          const adjustedConfidence = adjustConfidenceForHierarchy(
            result.eloScore.confidence,
            fallbackLevel,
          );

          hierarchicalResults.set(result.modelId, {
            ...result,
            eloScore: {
              ...result.eloScore,
              confidence: adjustedConfidence,
              fallbackLevel,
              originalCapability: tagId,
              usedCapability: parentTagId,
            },
          });
        }
      }
    } catch (error) {
      console.debug(`Failed to get parent results for ${parentTagId}:`, error);
    }
  }

  // Convert back to array and sort by adjusted score
  const results = Array.from(hierarchicalResults.values());

  // Sort by adjusted score (score * confidence to account for hierarchical penalty)
  results.sort((a, b) => {
    const scoreA = a.eloScore.score * a.eloScore.confidence;
    const scoreB = b.eloScore.score * b.eloScore.confidence;
    return scoreB - scoreA;
  });

  return results.slice(0, limit);
}
