/**
 * @file ELO data handling for fallbacks
 * @description Handles missing ELO data using heuristics and estimates
 */

import type { HierarchicalTagId } from "@/types/taxonomy";

import { getGlobalEloScore } from "../elo-lookup";
import { CAPABILITY_ADJUSTMENTS, MODEL_HEURISTICS } from "./constants";

/**
 * Handle missing ELO data for a model-capability pair
 */
export async function handleMissingEloData(
  modelId: string,
  capability: HierarchicalTagId,
): Promise<number> {
  try {
    // Try to get global ELO as proxy
    const globalElo = await getGlobalEloScore(modelId);
    if (globalElo > 1200) {
      return globalElo * 0.9; // Slightly lower for specific capability
    }
  } catch (error) {
    // Ignore error, use heuristics
  }

  // Use model-based heuristics
  const baseScore = MODEL_HEURISTICS[modelId] || 1200;

  // Adjust based on capability type
  const adjustment = CAPABILITY_ADJUSTMENTS[capability] || 1.0;

  return Math.round(baseScore * adjustment);
}
