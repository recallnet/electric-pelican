/**
 * @file Progress calculation utilities for router execution
 * @description Provides progress calculation and estimation logic
 */

import type { SingleExecutionProgress, WorkflowExecutionProgress } from "@/types/router";

/**
 * Calculate overall progress percentage for workflow execution
 */
export function calculateWorkflowProgress(progress: WorkflowExecutionProgress): number {
  if (progress.totalSteps === 0) return 0;

  const baseProgress = (progress.stepsCompleted / progress.totalSteps) * 100;

  // Add partial progress for current step (assume 50% if currently running)
  if (progress.status === "running" && progress.currentStep) {
    const currentStepProgress = 50; // Assume 50% progress on current step
    const progressPerStep = 100 / progress.totalSteps;
    return Math.min(baseProgress + (progressPerStep * currentStepProgress) / 100, 100);
  }

  return Math.min(baseProgress, 100);
}

/**
 * Calculate progress percentage for single execution
 */
export function calculateSingleProgress(progress: SingleExecutionProgress): number {
  switch (progress.status) {
    case "running":
      return 50; // Assume 50% when running
    case "completed":
      return 100;
    case "failed":
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

/**
 * Estimate time remaining for workflow execution
 */
export function estimateWorkflowTimeRemaining(progress: WorkflowExecutionProgress): number {
  if (!progress.startTime || progress.status !== "running") {
    return 0;
  }

  const elapsed = Date.now() - progress.startTime;
  const progressPercentage = calculateWorkflowProgress(progress);

  if (progressPercentage <= 0) {
    return 0;
  }

  const estimatedTotal = elapsed / (progressPercentage / 100);
  return Math.max(0, estimatedTotal - elapsed);
}

/**
 * Estimate time remaining for single execution
 */
export function estimateSingleTimeRemaining(
  progress: SingleExecutionProgress,
  averageExecutionTime: number = 15000,
): number {
  if (!progress.startTime || progress.status !== "running") {
    return 0;
  }

  const elapsed = Date.now() - progress.startTime;
  return Math.max(0, averageExecutionTime - elapsed);
}

/**
 * Calculate execution rate (steps per minute, tokens per second, etc.)
 */
export function calculateExecutionRate(
  completed: number,
  startTime: number,
  endTime?: number,
): number {
  const duration = (endTime || Date.now()) - startTime;
  if (duration <= 0) return 0;

  // Return rate per second
  return (completed / duration) * 1000;
}

/**
 * Calculate cost per token based on usage
 */
export function calculateCostEfficiency(tokensUsed: number, cost: number): number {
  if (tokensUsed === 0) return 0;
  return (cost / tokensUsed) * 1000; // Cost per 1K tokens
}

/**
 * Format progress as descriptive text
 */
export function formatProgressDescription(
  type: "single" | "workflow",
  progress: SingleExecutionProgress | WorkflowExecutionProgress,
): string {
  if (type === "single") {
    const singleProgress = progress as SingleExecutionProgress;
    switch (singleProgress.status) {
      case "running":
        return "Processing prompt with selected model...";
      case "completed":
        return "Execution completed successfully";
      case "failed":
        return "Execution failed";
      case "cancelled":
        return "Execution was cancelled";
      default:
        return "Preparing execution...";
    }
  } else {
    const workflowProgress = progress as WorkflowExecutionProgress;
    switch (workflowProgress.status) {
      case "running":
        return `Executing step ${workflowProgress.stepsCompleted + 1} of ${workflowProgress.totalSteps}`;
      case "completed":
        return `All ${workflowProgress.totalSteps} steps completed successfully`;
      case "failed":
        return `Failed at step ${workflowProgress.stepsCompleted + 1} of ${workflowProgress.totalSteps}`;
      case "cancelled":
        return "Workflow execution was cancelled";
      default:
        return "Preparing workflow execution...";
    }
  }
}

/**
 * Calculate quality score based on completion metrics
 */
export function calculateQualityScore(
  tokensUsed: number,
  executionTime: number,
  errorCount: number = 0,
): number {
  // Base score starts at 5 (perfect)
  let score = 5;

  // Reduce score for errors
  score -= errorCount * 0.5;

  // Reduce score for very long execution times (>2 minutes)
  if (executionTime > 120000) {
    score -= 0.5;
  }

  // Reduce score for very high token usage (>5k tokens)
  if (tokensUsed > 5000) {
    score -= 0.3;
  }

  return Math.max(1, Math.min(5, score));
}

/**
 * Compare two execution results
 */
export function compareExecutions(
  single?: { tokensUsed: number; cost: number; duration: number },
  workflow?: { tokensUsed: number; cost: number; duration: number },
): {
  fasterMode: "single" | "workflow" | "tie";
  cheaperMode: "single" | "workflow" | "tie";
  timeDifference: number;
  costDifference: number;
} {
  if (!single || !workflow) {
    return {
      fasterMode: "tie",
      cheaperMode: "tie",
      timeDifference: 0,
      costDifference: 0,
    };
  }

  const timeDifference = Math.abs(single.duration - workflow.duration);
  const costDifference = Math.abs(single.cost - workflow.cost);

  return {
    fasterMode:
      single.duration < workflow.duration
        ? "single"
        : workflow.duration < single.duration
          ? "workflow"
          : "tie",
    cheaperMode:
      single.cost < workflow.cost ? "single" : workflow.cost < single.cost ? "workflow" : "tie",
    timeDifference,
    costDifference,
  };
}
