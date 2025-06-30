/**
 * @file Router model selection types
 * @description Type definitions for model selection and optimization
 */

import type { HierarchicalTagId } from "../taxonomy";
import type { WorkflowStep } from "./analysis";

/**
 * Request for model selection
 */
export interface SelectModelsRequest {
  /** Workflow steps to assign models to */
  workflow: WorkflowStep[];
  /** Optional selection preferences */
  preferences?: {
    /** Prefer using a single model for the entire workflow */
    preferSingleModel?: boolean;
    /** Maximum number of different models to use */
    maxModels?: number;
    /** Minimum ELO threshold for model selection */
    minEloThreshold?: number;
    /** Model IDs to exclude from selection */
    excludeModels?: string[];
  };
}

/**
 * Response from model selection
 */
export interface SelectModelsResponse {
  success: boolean;
  data: {
    optimizedWorkflow: OptimizedWorkflowStep[];
    singleModelRecommendation: ModelRecommendation;
    modelSelectionReasoning: SelectionReasoning[];
    estimatedCost: number;
    estimatedTime: number;
  };
}

/**
 * Workflow step with assigned model
 */
export interface OptimizedWorkflowStep {
  /** Unique identifier for this step */
  id: string;
  /** Human-readable description of what this step does */
  description: string;
  /** Required capabilities for this step */
  requiredCapabilities: HierarchicalTagId[];
  /** Primary capability that drives this step */
  primaryCapability: HierarchicalTagId;
  /** Selected model for this step */
  selectedModel: ModelRecommendation;
  /** IDs of steps merged into this one (if any) */
  mergedSteps?: string[];
  /** IDs of previous steps this step depends on */
  dependencies: string[];
  /** Estimated token usage for this step */
  estimatedTokens: number;
  /** Priority level for execution ordering */
  priority: number;
}

/**
 * Model recommendation with ELO scores and reasoning
 */
export interface ModelRecommendation {
  /** OpenRouter model ID */
  modelId: string;
  /** Human-readable model name */
  modelName: string;
  /** Model provider (e.g., "OpenAI", "Anthropic") */
  provider: string;
  /** ELO score for this model's primary capability */
  eloScore: number;
  /** Human-readable reasoning for this selection */
  reasoning: string;
  /** Capability this model was selected for */
  selectedForCapability?: string;
  /** Human-readable name of the capability */
  selectedForCapabilityName?: string;
  /** Dominant capability for single-model recommendations */
  dominantCapability?: string;
  /** ELO scores for multiple capabilities */
  eloScores?: Record<string, number>;
  /** Average ELO score across all capabilities */
  averageElo?: number;
  /** Confidence in this selection (0-1) */
  confidence?: number;
}

/**
 * Reasoning for model selection decisions
 */
export interface SelectionReasoning {
  /** Step ID this reasoning applies to */
  stepId: string;
  /** Selected model ID */
  selectedModelId: string;
  /** Why this model was chosen */
  reasoning: string;
  /** Alternative models considered */
  alternatives: Array<{
    modelId: string;
    modelName: string;
    score: number;
    reason: string;
  }>;
  /** Confidence in this selection (0-1) */
  confidence: number;
}

/**
 * ELO score with metadata
 */
export interface EloScore {
  /** The ELO rating */
  score: number;
  /** Number of matches played */
  matchesPlayed: number;
  /** Win rate (0-1) */
  winRate: number;
  /** Confidence in this score (0-1) */
  confidence: number;
  /** Rank among all models for this capability */
  rank: number;
  /** Hierarchical fallback metadata (if score came from parent capability) */
  fallbackLevel?: number;
  /** Original capability requested (if different from used capability) */
  originalCapability?: HierarchicalTagId;
  /** Actual capability used for this score */
  usedCapability?: HierarchicalTagId;
}

/**
 * Model fitness for a set of capabilities
 */
export interface ModelFitness {
  /** Model ID */
  modelId: string;
  /** Overall fitness score */
  overallScore: number;
  /** Individual capability scores */
  capabilityScores: Record<HierarchicalTagId, EloScore>;
  /** Confidence in this fitness assessment */
  confidence: number;
  /** Whether this model is available */
  isAvailable: boolean;
}

/**
 * Selection strategy configuration
 */
export interface SelectionStrategy {
  /** Strategy name */
  name: "specialist" | "generalist" | "balanced";
  /** Weight for specialization vs generalization */
  specializationWeight: number;
  /** Weight for cost considerations */
  costWeight: number;
  /** Weight for speed considerations */
  speedWeight: number;
  /** Minimum confidence threshold */
  minConfidence: number;
}
