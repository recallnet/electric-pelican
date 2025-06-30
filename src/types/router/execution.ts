/**
 * @file Router execution engine types
 * @description Type definitions for execution orchestration and results
 */

import type { ModelRecommendation, OptimizedWorkflowStep } from "./selection";

/**
 * Execution request for parallel workflow and single-model execution
 */
export interface ExecutionRequest {
  prompt: string;
  workflow: OptimizedWorkflowStep[];
  singleModelRecommendation: ModelRecommendation;
  options?: ExecutionOptions;
}

/**
 * Execution options for controlling behavior
 */
export interface ExecutionOptions {
  includeIntermediateResults?: boolean;
  maxRetries?: number;
  timeout?: number;
  maxConcurrentSteps?: number;
}

/**
 * Initial response when starting execution
 */
export interface ExecutionStartResponse {
  executionId: string;
  status: "started";
  estimatedTime: number;
  streamUrl: string;
}

/**
 * Execution status response
 */
export interface ExecutionStatusResponse {
  executionId: string;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  results?: ExecutionResults;
  errors?: ExecutionError[];
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Execution status enum
 */
export type ExecutionStatus = "running" | "completed" | "failed" | "cancelled";

/**
 * Progress tracking for both execution modes
 */
export interface ExecutionProgress {
  single: SingleExecutionProgress;
  workflow: WorkflowExecutionProgress;
}

/**
 * Progress for single-model execution
 */
export interface SingleExecutionProgress {
  status: ExecutionStatus;
  startTime?: number;
  endTime?: number;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Progress for workflow execution
 */
export interface WorkflowExecutionProgress {
  status: ExecutionStatus;
  stepsCompleted: number;
  totalSteps: number;
  currentStep?: string;
  startTime?: number;
  endTime?: number;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Combined execution results
 */
export interface ExecutionResults {
  single?: CompletionResult;
  workflow?: CompletionResult;
  comparison?: ExecutionComparison;
}

/**
 * Individual completion result
 */
export interface CompletionResult {
  content: string;
  tokensUsed: number;
  cost: number;
  duration: number;
  modelUsed: string;
  stepResults?: StepResult[];
  metadata?: Record<string, any>;
}

/**
 * Comparison between single and workflow results
 */
export interface ExecutionComparison {
  qualityScore?: number;
  costDifference: number;
  timeDifference: number;
  recommendedApproach: "single" | "workflow";
  reasoning: string;
}

/**
 * Individual step execution result
 */
export interface StepResult {
  stepId: string;
  stepDescription: string;
  content: string;
  modelUsed: string;
  tokensUsed: number;
  cost: number;
  duration: number;
  attempt: number;
  success: boolean;
  error?: string;
  context?: string;
  timestamp: number;
}

/**
 * Execution error information
 */
export interface ExecutionError {
  stepId?: string;
  type: "model_error" | "timeout" | "validation" | "dependency" | "system";
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

/**
 * Execution context for managing state between steps
 */
export interface ExecutionContext {
  executionId: string;
  originalPrompt: string;
  stepResults: Map<string, StepResult>;
  globalContext: string;

  addResult(stepId: string, result: StepResult): void;
  getContext(stepId: string): string;
  buildPrompt(step: OptimizedWorkflowStep): string;
  getIntermediateResults(): StepResult[];
}

/**
 * Model execution interface
 */
export interface ModelExecutor {
  executeStep(
    step: OptimizedWorkflowStep,
    context: string,
    options: ExecutionOptions,
  ): Promise<StepResult>;

  getModelInfo(modelId: string): Promise<ModelInfo>;
  checkAvailability(modelId: string): Promise<boolean>;
}

/**
 * Model information for execution
 */
export interface ModelInfo {
  modelId: string;
  modelName: string;
  provider: string;
  available: boolean;
  contextLimit: number;
  costPer1kTokens: number;
  averageLatency: number;
}

/**
 * Model call options
 */
export interface ModelCallOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Model response from API
 */
export interface ModelResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Model metadata for execution planning
 */
export interface ModelMetadata {
  modelId: string;
  modelName: string;
  provider: string;
  costPer1kTokens: number;
  averageLatencyMs: number;
  maxContextLength: number;
}
