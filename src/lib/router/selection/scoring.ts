/**
 * @file Model scoring and estimation utilities
 * @description Handles cost and time estimation for model recommendations
 */

import type { ModelRecommendation } from "@/types/router";

import { getModelMetadata } from "./metadata";

/**
 * Estimate cost for a model recommendation
 * @param recommendation - Model recommendation
 * @param estimatedTokens - Estimated token usage
 * @returns Estimated cost in USD
 */
export async function estimateCost(
  recommendation: ModelRecommendation,
  estimatedTokens: number,
): Promise<number> {
  const metadata = await getModelMetadata(recommendation.modelId);
  return (estimatedTokens / 1000) * metadata.costPer1kTokens;
}

/**
 * Estimate execution time for a model recommendation
 * @param recommendation - Model recommendation
 * @param estimatedTokens - Estimated token usage
 * @returns Estimated time in milliseconds
 */
export async function estimateTime(
  recommendation: ModelRecommendation,
  estimatedTokens: number,
): Promise<number> {
  const metadata = await getModelMetadata(recommendation.modelId);

  // Base latency + processing time (rough estimate: 50ms per 1k tokens)
  const processingTime = (estimatedTokens / 1000) * 50;

  return metadata.averageLatencyMs + processingTime;
}
