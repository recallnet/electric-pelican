/**
 * @file Router API type definitions
 * @description Type definitions for router analysis API responses
 */

import type { HierarchicalTagId } from "./taxonomy";

/**
 * Response interface for the unified router API
 */
export interface RouterAnalysisResponse {
  success: boolean;
  data: {
    originalPrompt: string;
    // Single model recommendation (best overall)
    singleModelRecommendation: {
      modelId: string;
      modelName: string;
      provider: string;
      eloScore: number;
      reasoning: string;
      dominantCapability: HierarchicalTagId;
    };
    // Multi-step workflow with models assigned
    workflow: Array<{
      id: string;
      description: string;
      primaryCapability: HierarchicalTagId;
      capabilityName: string;
      estimatedTokens: number;
      selectedModel: {
        modelId: string;
        modelName: string;
        provider: string;
        eloScore: number;
        reasoning: string;
        // Capability used for model selection
        selectedForCapability: HierarchicalTagId;
        selectedForCapabilityName: string;
      };
      dependencies: string[];
    }>;
    // Analysis metadata
    analysisTime: number;
    estimatedComplexity: "simple" | "moderate" | "complex";
  };
}
