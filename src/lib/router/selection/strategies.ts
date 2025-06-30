/**
 * @file Core model selection strategies
 * @description Implements specialist, generalist, and balanced approaches to model selection
 */

import type {
  EloScore,
  ModelMetadata,
  ModelRecommendation,
  SelectionStrategy,
} from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { getModelMetadata } from "./metadata";

/**
 * Available selection strategies
 */
export const SELECTION_STRATEGIES: Record<string, SelectionStrategy> = {
  specialist: {
    name: "specialist",
    specializationWeight: 0.8,
    costWeight: 0.1,
    speedWeight: 0.1,
    minConfidence: 0.3,
  },
  generalist: {
    name: "generalist",
    specializationWeight: 0.3,
    costWeight: 0.3,
    speedWeight: 0.4,
    minConfidence: 0.2,
  },
  balanced: {
    name: "balanced",
    specializationWeight: 0.5,
    costWeight: 0.25,
    speedWeight: 0.25,
    minConfidence: 0.25,
  },
};

/**
 * Select the best model for a single capability using specialist strategy
 * @param capability - The capability tag ID
 * @param strategy - Selection strategy to use
 * @param excludeModels - Model IDs to exclude from selection
 * @returns Model recommendation
 */
export async function selectSpecialistModel(
  capability: HierarchicalTagId,
  strategy: SelectionStrategy = SELECTION_STRATEGIES.specialist as SelectionStrategy,
  excludeModels: string[] = [],
): Promise<ModelRecommendation | null> {
  try {
    // Use hierarchical lookup to get top models for this capability
    const { getTopModelsForCapabilityHierarchical } = await import("../elo-lookup");
    const topModels = await getTopModelsForCapabilityHierarchical(capability, 20);

    if (topModels.length === 0) {
      return null;
    }

    // Filter out excluded models
    const availableModels = topModels.filter((m) => !excludeModels.includes(m.modelId));

    if (availableModels.length === 0) {
      return null;
    }

    // Score each model based on the strategy
    const scoredModels = await Promise.all(
      availableModels.map(async (model) => {
        const metadata = await getModelMetadata(model.modelId);
        const score = calculateStrategyScore(model.eloScore, metadata, strategy);

        return {
          ...model,
          metadata,
          strategyScore: score,
        };
      }),
    );

    // Sort by strategy score (highest first)
    scoredModels.sort((a, b) => b.strategyScore - a.strategyScore);

    const bestModel = scoredModels[0];
    if (!bestModel) {
      return null;
    }

    // Convert EloScore to number for eloScores record
    const eloScores: Record<HierarchicalTagId, number> = {
      [capability]: bestModel.eloScore.score,
    };

    // Include hierarchical fallback information in reasoning if applicable
    let reasoning = `Selected as specialist for ${capability} (ELO: ${bestModel.eloScore.score}, Rank: ${bestModel.eloScore.rank})`;

    if (bestModel.eloScore.fallbackLevel && bestModel.eloScore.fallbackLevel > 0) {
      reasoning += ` - Using hierarchical fallback from ${bestModel.eloScore.usedCapability} (${bestModel.eloScore.fallbackLevel} level${bestModel.eloScore.fallbackLevel > 1 ? "s" : ""} up)`;
    }

    return {
      modelId: bestModel.modelId,
      modelName: bestModel.modelName,
      provider: bestModel.metadata.provider,
      eloScore: bestModel.eloScore.score,
      eloScores,
      averageElo: bestModel.eloScore.score,
      confidence: bestModel.eloScore.confidence,
      reasoning,
    };
  } catch (error) {
    console.warn(`Failed to select specialist model for ${capability}:`, error);
    return null;
  }
}

/**
 * Select the best model for multiple capabilities using generalist strategy
 * @param capabilities - Array of capability tag IDs with optional weights
 * @param strategy - Selection strategy to use
 * @param excludeModels - Model IDs to exclude from selection
 * @returns Model recommendation
 */
export async function selectGeneralistModel(
  capabilities: Array<{ tagId: HierarchicalTagId; weight?: number }>,
  strategy: SelectionStrategy = SELECTION_STRATEGIES.generalist as SelectionStrategy,
  excludeModels: string[] = [],
): Promise<ModelRecommendation | null> {
  try {
    // Get candidate models from all capabilities using hierarchical lookup
    const candidateModelIds = new Set<string>();

    for (const { tagId } of capabilities) {
      // Use hierarchical lookup to get more comprehensive model coverage
      const { getTopModelsForCapabilityHierarchical } = await import("../elo-lookup");
      const topModels = await getTopModelsForCapabilityHierarchical(tagId, 15);
      topModels.forEach((m) => candidateModelIds.add(m.modelId));
    }

    // Filter out excluded models
    const availableModelIds = Array.from(candidateModelIds).filter(
      (id) => !excludeModels.includes(id),
    );

    if (availableModelIds.length === 0) {
      return null;
    }

    // Calculate hierarchical fitness for each candidate model
    const { calculateModelFitnessHierarchical } = await import("../elo-lookup");
    const modelFitnesses = await Promise.all(
      availableModelIds.map(async (modelId) => {
        const fitness = await calculateModelFitnessHierarchical(modelId, capabilities);
        const metadata = await getModelMetadata(modelId);

        // Calculate strategy score
        const avgEloScore: EloScore = {
          score: fitness.overallScore,
          matchesPlayed: Math.min(
            ...Object.values(fitness.capabilityScores).map((s) => s.matchesPlayed),
          ),
          winRate: 0.5, // Placeholder
          confidence: fitness.confidence,
          rank: 1, // Placeholder
        };

        const strategyScore = calculateStrategyScore(avgEloScore, metadata, strategy);

        return {
          fitness,
          metadata,
          strategyScore,
        };
      }),
    );

    // Filter by minimum confidence
    const qualifiedModels = modelFitnesses.filter(
      (m) => m.fitness.confidence >= strategy.minConfidence,
    );

    if (qualifiedModels.length === 0) {
      return null;
    }

    // Sort by strategy score
    qualifiedModels.sort((a, b) => b.strategyScore - a.strategyScore);

    const bestModel = qualifiedModels[0];
    if (!bestModel) {
      return null;
    }

    const capabilityNames = capabilities.map((c) => c.tagId).join(", ");

    // Convert EloScore objects to numbers for eloScores record
    const eloScores: Record<HierarchicalTagId, number> = {};
    Object.entries(bestModel.fitness.capabilityScores).forEach(([tagId, eloScore]) => {
      eloScores[tagId as HierarchicalTagId] = eloScore.score;
    });

    // Build reasoning with hierarchical fallback information
    let reasoning = `Selected as generalist for multiple capabilities: ${capabilityNames} (Avg ELO: ${Math.round(bestModel.fitness.overallScore)})`;

    // Check if any capabilities used hierarchical fallback
    const hierarchicalCapabilities = Object.values(bestModel.fitness.capabilityScores).filter(
      (score) => score.fallbackLevel && score.fallbackLevel > 0,
    );

    if (hierarchicalCapabilities.length > 0) {
      reasoning += ` - ${hierarchicalCapabilities.length} capability(ies) used hierarchical fallback`;
    }

    return {
      modelId: bestModel.fitness.modelId,
      modelName: bestModel.metadata.modelName,
      provider: bestModel.metadata.provider,
      eloScore: bestModel.fitness.overallScore,
      eloScores,
      averageElo: bestModel.fitness.overallScore,
      confidence: bestModel.fitness.confidence,
      reasoning,
    };
  } catch (error) {
    console.warn(`Failed to select generalist model for capabilities:`, error);
    return null;
  }
}

/**
 * Calculate strategy-based score for a model
 * @param eloScore - ELO score data
 * @param metadata - Model metadata
 * @param strategy - Selection strategy
 * @returns Calculated score (higher is better)
 */
export function calculateStrategyScore(
  eloScore: EloScore,
  metadata: ModelMetadata,
  strategy: SelectionStrategy,
): number {
  // Normalize ELO score (1200-1800 range typical)
  const normalizedElo = Math.max(0, Math.min(1, (eloScore.score - 1000) / 800));

  // Normalize cost (lower cost is better)
  const normalizedCost = Math.max(0, Math.min(1, 1 - metadata.costPer1kTokens / 0.1));

  // Normalize speed (lower latency is better)
  const normalizedSpeed = Math.max(0, Math.min(1, 1 - metadata.averageLatencyMs / 10000));

  // Apply confidence factor
  const confidenceFactor = Math.max(0.1, eloScore.confidence);

  // Calculate weighted score
  const score =
    (normalizedElo * strategy.specializationWeight +
      normalizedCost * strategy.costWeight +
      normalizedSpeed * strategy.speedWeight) *
    confidenceFactor;

  return score;
}

/**
 * Get the appropriate strategy based on preferences
 * @param preferences - User preferences
 * @returns Selection strategy
 */
export function getSelectionStrategy(preferences?: {
  preferSingleModel?: boolean;
  maxModels?: number;
  minEloThreshold?: number;
}): SelectionStrategy {
  if (preferences?.preferSingleModel) {
    return SELECTION_STRATEGIES.generalist as SelectionStrategy;
  }

  if (preferences?.maxModels && preferences.maxModels <= 2) {
    return SELECTION_STRATEGIES.balanced as SelectionStrategy;
  }

  return SELECTION_STRATEGIES.specialist as SelectionStrategy;
}
