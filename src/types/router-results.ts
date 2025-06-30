import type {
  ExecutionComparison,
  ModelRecommendation,
  OptimizedWorkflowStep,
  WorkflowAnalysis,
} from "./router";
import type { CompletionResult, IntermediateResult } from "./router-ui";

export interface RouterExecutionResult {
  id: string;
  executionId: string;
  originalPrompt: string;
  completedAt: Date;

  // Analysis Results
  analysisResult: WorkflowAnalysis;
  singleModelRecommendation: ModelRecommendation;
  optimizedWorkflow: OptimizedWorkflowStep[];

  // Execution Results
  singleResult?: CompletionResult;
  workflowResult?: CompletionResult;
  intermediateResults: IntermediateResult[];

  // Comparison Data
  comparisonData?: ExecutionComparison;

  // Model ELO data at time of execution - just the models that were used
  modelEloData: ModelEloData;

  // Metadata
  totalExecutionTime: number;
  routerVersion: string;
  createdAt: Date;
}

/**
 * ELO data for the specific models used in the router execution.
 * Captures the scores that influenced the routing decisions.
 */
export interface ModelEloData {
  capturedAt: Date;
  models: Record<string, ModelEloScore>;
  tagScores: Record<string, Record<string, TagEloScore>>;
}

export interface ModelEloScore {
  modelId: string;
  name: string;
  provider: string;
  globalScore: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

export interface TagEloScore {
  modelId: string;
  tagId: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

// API Request/Response Types
export interface SaveExecutionRequest {
  executionId: string;
}

export interface SaveExecutionResponse {
  success: boolean;
  data: {
    resultId: string;
    shareUrl: string;
  };
  error?: string;
  message?: string;
}

export interface GetExecutionResponse {
  success: boolean;
  data: RouterExecutionResult | null;
  error?: string;
  message?: string;
}
