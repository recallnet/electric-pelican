/**
 * @file Router analysis and workflow types
 * @description Type definitions for prompt analysis and workflow decomposition
 */

import type { HierarchicalTagId } from "../taxonomy";

/**
 * Request for prompt analysis
 */
export interface AnalyzeRequest {
  /** The user prompt to analyze */
  prompt: string;
}

/**
 * Response from prompt analysis
 */
export interface AnalyzeResponse {
  success: boolean;
  data: {
    originalPrompt: string;
    workflow: WorkflowStep[];
    dominantCapability: HierarchicalTagId;
    estimatedComplexity: "simple" | "moderate" | "complex";
    analysisTime: number;
  };
}

/**
 * Individual step in a workflow
 */
export interface WorkflowStep {
  /** Unique identifier for this step */
  id: string;
  /** Human-readable description of what this step does */
  description: string;
  /** Required capabilities for this step */
  requiredCapabilities: HierarchicalTagId[];
  /** IDs of previous steps this step depends on */
  dependencies: string[];
  /** Estimated token usage for this step */
  estimatedTokens: number;
  /** Priority level for execution ordering */
  priority: number;
}

/**
 * Complete workflow analysis result
 */
export interface WorkflowAnalysis {
  /** The original prompt that was analyzed */
  originalPrompt: string;
  /** Decomposed workflow steps */
  workflow: WorkflowStep[];
  /** Primary capability that dominates the prompt */
  dominantCapability: HierarchicalTagId;
  /** Estimated complexity level */
  estimatedComplexity: "simple" | "moderate" | "complex";
  /** Time taken for analysis in milliseconds */
  analysisTime: number;
}

/**
 * Router model response structure
 */
export interface RouterModelResponse {
  /** Generated workflow steps */
  workflow: Array<{
    description: string;
    capabilities: string[];
    dependencies: string[];
    tokens: number;
  }>;
  /** Dominant capability for single-model fallback */
  dominantCapability: string;
  /** Estimated complexity */
  complexity: "simple" | "moderate" | "complex";
}

/**
 * Configuration for router analysis
 */
export interface RouterConfig {
  /** Maximum number of workflow steps (default: 8) */
  maxSteps: number;
  /** Router model to use for analysis */
  routerModel: string;
  /** Timeout for analysis in milliseconds */
  timeoutMs: number;
}

/**
 * Tag validation result for router capabilities
 */
export interface RouterTagValidationResult {
  /** Successfully validated tag IDs */
  validTags: HierarchicalTagId[];
  /** Invalid tag IDs that couldn't be validated */
  invalidTags: string[];
  /** Whether any valid tags were found */
  success: boolean;
}
