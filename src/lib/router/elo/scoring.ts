/**
 * @file ELO scoring and model fitness calculations
 * @description Handles model fitness assessment across multiple capabilities
 */

import type { EloScore, ModelFitness } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { checkModelAvailability, createFallbackEloScore, getModelEloScores } from "./client";
import { getHierarchicalEloScore } from "./hierarchical";

/**
 * Calculate model fitness across multiple capabilities
 * @param modelId - The model ID to evaluate
 * @param capabilities - Required capabilities with optional weights
 * @returns Model fitness assessment
 */
export async function calculateModelFitness(
  modelId: string,
  capabilities: Array<{ tagId: HierarchicalTagId; weight?: number }>,
): Promise<ModelFitness> {
  const tagIds = capabilities.map((c) => c.tagId);
  const capabilityScores = await getModelEloScores(modelId, tagIds);

  // Calculate weighted average score
  let totalWeight = 0;
  let weightedSum = 0;
  let minConfidence = 1.0;

  capabilities.forEach(({ tagId, weight = 1.0 }) => {
    const score = capabilityScores[tagId];
    if (score) {
      weightedSum += score.score * weight;
      totalWeight += weight;
      minConfidence = Math.min(minConfidence, score.confidence);
    }
  });

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 1200; // Default ELO

  return {
    modelId,
    overallScore,
    capabilityScores,
    confidence: minConfidence,
    isAvailable: await checkModelAvailability(modelId),
  };
}

/**
 * Calculate model fitness with hierarchical ELO lookup
 * @param modelId - The model ID to evaluate
 * @param capabilities - Required capabilities with optional weights
 * @returns Model fitness assessment with hierarchical scores
 */
export async function calculateModelFitnessHierarchical(
  modelId: string,
  capabilities: Array<{ tagId: HierarchicalTagId; weight?: number }>,
): Promise<ModelFitness> {
  const capabilityScores: Record<HierarchicalTagId, EloScore> = {};

  // Get hierarchical scores for each capability
  for (const { tagId } of capabilities) {
    const hierarchicalScore = await getHierarchicalEloScore(modelId, tagId);

    if (hierarchicalScore) {
      capabilityScores[tagId] = hierarchicalScore;
    } else {
      // Create fallback score if no hierarchical score available
      capabilityScores[tagId] = createFallbackEloScore(modelId, tagId);
    }
  }

  // Calculate weighted average score
  let totalWeight = 0;
  let weightedSum = 0;
  let minConfidence = 1.0;

  capabilities.forEach(({ tagId, weight = 1.0 }) => {
    const score = capabilityScores[tagId];
    if (score) {
      weightedSum += score.score * weight;
      totalWeight += weight;
      minConfidence = Math.min(minConfidence, score.confidence);
    }
  });

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 1200; // Default ELO

  return {
    modelId,
    overallScore,
    capabilityScores,
    confidence: minConfidence,
    isAvailable: await checkModelAvailability(modelId),
  };
}
