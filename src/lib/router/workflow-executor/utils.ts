/**
 * @file Workflow execution utilities
 * @description Helper functions for progress tracking and result formatting
 */

/**
 * Calculate estimated time remaining for workflow execution
 */
export function calculateEstimatedTimeRemaining(
  currentStep: number,
  totalSteps: number,
  elapsedTime: number,
): number {
  if (currentStep === 0) return 0;

  const averageTimePerStep = elapsedTime / currentStep;
  const remainingSteps = totalSteps - currentStep;
  return Math.round(remainingSteps * averageTimePerStep);
}

/**
 * Format result for streaming (truncate if needed)
 */
export function formatResultForStreaming(result: string, maxLength: number = 5000): string {
  if (result.length <= maxLength) {
    return result;
  }
  return result.substring(0, maxLength) + "...";
}
