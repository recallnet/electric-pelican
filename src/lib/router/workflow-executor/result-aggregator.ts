/**
 * @file Workflow result aggregation
 * @description Combines step results into final workflow completion results
 */

import type { CompletionResult, StepResult } from "@/types/router";

/**
 * Aggregate workflow results into a single completion result
 */
export function aggregateWorkflowResults(
  __originalPrompt: string,
  results: StepResult[],
  duration: number,
  errors: string[],
): CompletionResult {
  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  // Combine successful step results
  let content = "";
  if (successfulResults.length > 0) {
    content = successfulResults
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((result) => {
        const header = `## ${result.stepDescription}\n`;
        return header + result.content;
      })
      .join("\n\n");
  }

  // Add error summary if there were failures
  if (failedResults.length > 0) {
    content += "\n\n## Execution Notes\n";
    content += `${failedResults.length} step(s) encountered issues:\n`;
    failedResults.forEach((result) => {
      content += `- ${result.stepDescription}: ${result.error}\n`;
    });
  }

  // Calculate totals
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

  // Get unique models used
  const modelsUsed = [...new Set(results.map((r) => r.modelUsed))];

  return {
    content: content || "No successful results generated",
    tokensUsed: totalTokens,
    cost: totalCost,
    duration,
    modelUsed: modelsUsed.join(", "),
    stepResults: results,
    metadata: {
      approach: "workflow",
      stepsCompleted: successfulResults.length,
      totalSteps: results.length,
      modelsUsed,
      averageStepDuration: results.length > 0 ? duration / results.length : 0,
      successRate: results.length > 0 ? successfulResults.length / results.length : 0,
      errors: errors.length > 0 ? errors : undefined,
      success: successfulResults.length > 0,
    },
  };
}

/**
 * Calculate workflow execution statistics
 */
export function calculateWorkflowStats(result: CompletionResult): {
  efficiency: number;
  parallelization: number;
  modelDiversity: number;
  qualityScore: number;
} {
  const stepResults = result.stepResults || [];
  const metadata = result.metadata as any;

  if (stepResults.length === 0) {
    return { efficiency: 0, parallelization: 0, modelDiversity: 0, qualityScore: 0 };
  }

  // Calculate average step efficiency
  const avgStepDuration = metadata?.averageStepDuration || result.duration;
  const efficiency = Math.min(1, 5000 / avgStepDuration); // Normalize to 5 second baseline

  // Calculate parallelization effectiveness
  const theoreticalSequentialTime = stepResults.reduce((sum, step) => sum + step.duration, 0);
  const parallelization =
    theoreticalSequentialTime > 0 ? Math.min(1, theoreticalSequentialTime / result.duration) : 0;

  // Calculate model diversity
  const uniqueModels = metadata?.modelsUsed?.length || 1;
  const modelDiversity = Math.min(1, uniqueModels / 3); // Normalize to 3 models

  // Calculate quality score based on content and success rate
  const contentQuality = Math.min(1, result.content.length / 2000); // Normalize to 2000 chars
  const successRate = metadata?.successRate || 0;
  const qualityScore = contentQuality * 0.7 + successRate * 0.3;

  return {
    efficiency,
    parallelization,
    modelDiversity,
    qualityScore,
  };
}
