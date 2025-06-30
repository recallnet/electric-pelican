/**
 * @file Fallback selection validation
 * @description Validates that fallback selections are reasonable and acceptable
 */

import type { ModelRecommendation } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { CAPABILITY_FALLBACKS, FALLBACK_MODELS } from "./constants";

/**
 * Validate that a fallback selection is reasonable
 */
export function validateFallbackSelection(
  model: ModelRecommendation,
  originalCapabilities: HierarchicalTagId[],
): boolean {
  // Check confidence threshold
  if ((model.confidence ?? 0) < 0.05) {
    return false;
  }

  // Check if model is known
  const knownModels = Object.keys(FALLBACK_MODELS);
  if (!knownModels.includes(model.modelId)) {
    return false;
  }

  // Check if model has some relevant capabilities
  const hasRelevantCapability = originalCapabilities.some((cap) =>
    Object.keys(CAPABILITY_FALLBACKS).includes(cap),
  );

  return hasRelevantCapability || (model.confidence ?? 0) > 0.3;
}
