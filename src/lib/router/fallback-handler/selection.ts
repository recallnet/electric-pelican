/**
 * @file Core fallback model selection logic
 * @description Main fallback mechanisms for model selection failures
 */

import type { ModelRecommendation, WorkflowStep } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { getGlobalEloScore } from "../elo-lookup";
import { CAPABILITY_FALLBACKS, FALLBACK_MODELS } from "./constants";
import { tryParentCapabilityFallback } from "./hierarchy";

/**
 * Handle model selection fallback when primary selection fails
 */
export async function handleModelSelectionFallback(
  step: WorkflowStep,
  excludeModels: string[] = [],
  reason: string = "Primary selection failed",
): Promise<ModelRecommendation> {
  try {
    // Try capability-specific fallback first
    const capabilityFallback = await tryCapabilityFallback(
      step.requiredCapabilities,
      excludeModels,
    );
    if (capabilityFallback) {
      capabilityFallback.reasoning = `Fallback: ${reason}. ${capabilityFallback.reasoning}`;
      return capabilityFallback;
    }

    // Try parent capability fallback
    const parentFallback = await tryParentCapabilityFallback(
      step.requiredCapabilities,
      excludeModels,
    );
    if (parentFallback) {
      parentFallback.reasoning = `Fallback: ${reason}. Using parent capability mapping. ${parentFallback.reasoning}`;
      return parentFallback;
    }

    // Use general fallback
    const generalFallback = await getGeneralFallback(excludeModels);
    generalFallback.reasoning = `Fallback: ${reason}. Using general-purpose model. ${generalFallback.reasoning}`;

    return generalFallback;
  } catch (error) {
    console.error("All fallback model selection mechanisms failed:", error);
    throw new Error(
      `Model selection completely failed for step "${step.id}" with capabilities [${step.requiredCapabilities.join(", ")}]. Reason: ${reason}. Original error: ${error}`,
    );
  }
}

/**
 * Try to select a fallback model based on specific capabilities
 */
export async function tryCapabilityFallback(
  capabilities: HierarchicalTagId[],
  excludeModels: string[],
): Promise<ModelRecommendation | null> {
  for (const capability of capabilities) {
    const fallbackModels = CAPABILITY_FALLBACKS[capability] || [];

    for (const modelId of fallbackModels) {
      if (!excludeModels.includes(modelId)) {
        const baseFallback = FALLBACK_MODELS[modelId];
        if (baseFallback) {
          const fallback = { ...baseFallback };
          // Try to get actual ELO score
          try {
            const globalElo = await getGlobalEloScore(modelId);
            fallback.averageElo = globalElo;
            fallback.eloScores = { [capability]: globalElo };
          } catch (error) {
            // Use default scores
          }

          fallback.reasoning = `Selected for ${capability} capability`;
          return fallback;
        }
      }
    }
  }

  return null;
}

/**
 * Get a general-purpose fallback model
 */
export async function getGeneralFallback(excludeModels: string[]): Promise<ModelRecommendation> {
  const availableModels = Object.keys(FALLBACK_MODELS).filter((id) => !excludeModels.includes(id));

  if (availableModels.length === 0) {
    throw new Error("No fallback models available");
  }

  // Prefer Claude 3 Sonnet as general fallback
  const preferredOrder = ["claude-3-sonnet", "gpt-4", "gpt-4o"];

  for (const preferred of preferredOrder) {
    if (availableModels.includes(preferred)) {
      const baseFallback = FALLBACK_MODELS[preferred];
      if (baseFallback) {
        const fallback = { ...baseFallback };
        try {
          const globalElo = await getGlobalEloScore(preferred);
          fallback.averageElo = globalElo;
        } catch (error) {
          // Use default
        }
        return fallback;
      }
    }
  }

  // Use first available model
  const firstAvailable = availableModels[0];
  if (firstAvailable) {
    const baseFallback = FALLBACK_MODELS[firstAvailable];
    if (baseFallback) {
      return { ...baseFallback };
    }
  }

  throw new Error("No fallback model selected");
}
