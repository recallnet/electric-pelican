/**
 * @file Step processing utilities
 * @description Validation, estimation, and comparison logic for execution steps
 */

import type { CompletionResult, ExecutionComparison, ExecutionRequest } from "@/types/router";

import { calculateSingleModelStats, validateSingleModelExecution } from "../single-executor";
import { calculateWorkflowStats, validateWorkflowExecution } from "../workflow-executor/index";

/**
 * Validate execution request
 */
export function validateExecutionRequest(request: ExecutionRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate single model execution
  const singleValidation = validateSingleModelExecution(
    request.prompt,
    request.singleModelRecommendation,
  );
  errors.push(...singleValidation.errors);

  // Validate workflow execution
  const workflowValidation = validateWorkflowExecution(request.prompt, request.workflow);
  errors.push(...workflowValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate total execution time
 */
export function estimateExecutionTime(request: ExecutionRequest): number {
  // Estimate single model time
  const singleModelTime = estimateTokens(request.prompt) * 0.05; // ~50ms per token

  // Estimate workflow time (parallel execution considered)
  const workflowTime = request.workflow.reduce((max, step) => {
    const stepTime = step.estimatedTokens * 0.05;
    return Math.max(max, stepTime);
  }, 0);

  // Return the maximum (since they run in parallel) plus overhead
  return Math.max(singleModelTime, workflowTime) + 2000; // 2s overhead
}

/**
 * Generate comparison between single and workflow results
 */
export function generateExecutionComparison(
  singleResult: CompletionResult,
  workflowResult: CompletionResult,
): ExecutionComparison {
  const singleStats = calculateSingleModelStats(singleResult);
  const workflowStats = calculateWorkflowStats(workflowResult);

  // Calculate cost and time differences
  const costDifference = workflowResult.cost - singleResult.cost;
  const timeDifference = workflowResult.duration - singleResult.duration;

  // Determine recommended approach
  let recommendedApproach: "single" | "workflow" = "single";
  let reasoning = "";

  const singleSuccess = singleResult.metadata?.success !== false;
  const workflowSuccess = workflowResult.metadata?.success !== false;

  if (!singleSuccess && workflowSuccess) {
    recommendedApproach = "workflow";
    reasoning = "Single model failed, workflow succeeded";
  } else if (singleSuccess && !workflowSuccess) {
    recommendedApproach = "single";
    reasoning = "Workflow failed, single model succeeded";
  } else if (singleSuccess && workflowSuccess) {
    const qualityDiff = workflowStats.qualityScore - singleStats.qualityScore;

    if (qualityDiff > 0.2) {
      recommendedApproach = "workflow";
      reasoning = `Workflow provides better quality (+${(qualityDiff * 100).toFixed(1)}%)`;
    } else {
      recommendedApproach = "single";
      reasoning = "Single model provides good balance of quality and efficiency";
    }
  } else {
    recommendedApproach = "single";
    reasoning = "Single model is simpler fallback";
  }

  return {
    costDifference,
    timeDifference,
    recommendedApproach,
    reasoning,
    qualityScore: workflowStats.qualityScore - singleStats.qualityScore,
  };
}

/**
 * Estimate tokens in text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
