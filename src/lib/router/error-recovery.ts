/**
 * @file Error recovery and retry logic for Router-3A
 * @description Handles model failures, retry logic, and graceful degradation
 */

import type {
  ExecutionError,
  ExecutionOptions,
  ModelExecutor,
  OptimizedWorkflowStep,
  RetryConfig,
  StepResult,
} from "@/types/router";

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    "timeout",
    "rate_limit",
    "server_error",
    "network_error",
    "temporary_unavailable",
  ],
};

/**
 * Execute a step with retry logic and error recovery
 */
export async function executeStepWithRetry(
  step: OptimizedWorkflowStep,
  context: string,
  modelExecutor: ModelExecutor,
  options: ExecutionOptions,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<StepResult> {
  let lastError: Error | null = null;
  let attempt = 0;

  for (attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const result = await modelExecutor.executeStep(step, context, options);

      // Update attempt count in result
      result.attempt = attempt;

      if (result.success) {
        return result;
      }

      // If step failed but we have more attempts, continue
      if (attempt < retryConfig.maxAttempts && result.error) {
        lastError = new Error(result.error);

        if (isRetryableError(result.error, retryConfig)) {
          await delay(calculateBackoffDelay(attempt, retryConfig));
          continue;
        }
      }

      // Non-retryable error or last attempt
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Check if error is retryable
      if (isRetryableError(lastError.message, retryConfig) && attempt < retryConfig.maxAttempts) {
        await delay(calculateBackoffDelay(attempt, retryConfig));
        continue;
      }

      // Non-retryable error or last attempt - return failed result
      return createFailedStepResult(step, lastError, attempt);
    }
  }

  // Should not reach here, but just in case
  return createFailedStepResult(step, lastError || new Error("Max retries exceeded"), attempt);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(errorMessage: string, config: RetryConfig): boolean {
  const lowerError = errorMessage.toLowerCase();

  return config.retryableErrors.some((retryableError) =>
    lowerError.includes(retryableError.toLowerCase()),
  );
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;

  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Create a failed step result
 */
function createFailedStepResult(
  step: OptimizedWorkflowStep,
  error: Error,
  attempt: number,
): StepResult {
  return {
    stepId: step.id,
    stepDescription: step.description,
    content: "",
    modelUsed: step.selectedModel.modelId,
    tokensUsed: 0,
    cost: 0,
    duration: 0,
    attempt,
    success: false,
    error: error.message,
    timestamp: Date.now(),
  };
}

/**
 * Delay function for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create execution error from step failure
 */
export function createExecutionError(
  stepId: string,
  error: Error,
  retryable: boolean = false,
): ExecutionError {
  return {
    stepId,
    type: classifyErrorType(error.message),
    message: error.message,
    details: {
      stack: error.stack,
      name: error.name,
    },
    timestamp: Date.now(),
    retryable,
  };
}

/**
 * Classify error type based on error message
 */
function classifyErrorType(errorMessage: string): ExecutionError["type"] {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes("timeout")) return "timeout";
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) return "validation";
  if (lowerMessage.includes("dependency") || lowerMessage.includes("missing")) return "dependency";
  if (lowerMessage.includes("model") || lowerMessage.includes("api")) return "model_error";

  return "system";
}

/**
 * Handle workflow step failure with graceful degradation
 */
export async function handleStepFailure(
  failedStep: OptimizedWorkflowStep,
  error: Error,
  workflow: OptimizedWorkflowStep[],
  completedSteps: StepResult[],
): Promise<{
  shouldContinue: boolean;
  modifiedWorkflow?: OptimizedWorkflowStep[];
  fallbackResult?: StepResult;
}> {
  // Check if we can continue without this step
  const dependentSteps = workflow.filter((step) => step.dependencies.includes(failedStep.id));

  if (dependentSteps.length === 0) {
    // No dependent steps, we can continue
    return {
      shouldContinue: true,
      fallbackResult: createPartialStepResult(failedStep, error),
    };
  }

  // Check if we can provide a fallback result
  const fallbackResult = await createFallbackResult(failedStep, completedSteps);

  if (fallbackResult) {
    return {
      shouldContinue: true,
      fallbackResult,
    };
  }

  // Remove dependent steps that can't proceed
  const modifiedWorkflow = workflow.filter(
    (step) => !step.dependencies.includes(failedStep.id) && step.id !== failedStep.id,
  );

  return {
    shouldContinue: modifiedWorkflow.length > 0,
    modifiedWorkflow,
    fallbackResult: createPartialStepResult(failedStep, error),
  };
}

/**
 * Create a partial result for a failed step
 */
function createPartialStepResult(step: OptimizedWorkflowStep, error: Error): StepResult {
  return {
    stepId: step.id,
    stepDescription: step.description,
    content: `[Step failed: ${error.message}]`,
    modelUsed: step.selectedModel.modelId,
    tokensUsed: 0,
    cost: 0,
    duration: 0,
    attempt: 1,
    success: false,
    error: error.message,
    timestamp: Date.now(),
  };
}

/**
 * Create a fallback result based on completed steps
 */
async function createFallbackResult(
  failedStep: OptimizedWorkflowStep,
  completedSteps: StepResult[],
): Promise<StepResult | null> {
  // Simple fallback: try to infer result from completed steps
  if (completedSteps.length === 0) {
    return null;
  }

  // For now, just return a placeholder
  // In a more sophisticated implementation, this could use AI to generate
  // a reasonable fallback based on the completed steps
  return {
    stepId: failedStep.id,
    stepDescription: failedStep.description,
    content: `[Fallback result based on previous steps: ${completedSteps.map((s) => s.stepDescription).join(", ")}]`,
    modelUsed: "fallback",
    tokensUsed: 0,
    cost: 0,
    duration: 0,
    attempt: 1,
    success: true, // Mark as success since we provided a fallback
    timestamp: Date.now(),
  };
}

/**
 * Recovery strategies for different error types
 */
export const RECOVERY_STRATEGIES = {
  timeout: {
    retry: true,
    increaseTimeout: true,
    fallbackModel: false,
  },
  rate_limit: {
    retry: true,
    increaseDelay: true,
    fallbackModel: true,
  },
  model_error: {
    retry: false,
    fallbackModel: true,
    skipStep: false,
  },
  validation: {
    retry: false,
    fallbackModel: false,
    skipStep: true,
  },
  dependency: {
    retry: false,
    fallbackModel: false,
    skipStep: true,
  },
  system: {
    retry: true,
    fallbackModel: false,
    skipStep: false,
  },
} as const;

/**
 * Get recovery strategy for error type
 */
export function getRecoveryStrategy(errorType: ExecutionError["type"]) {
  return RECOVERY_STRATEGIES[errorType] || RECOVERY_STRATEGIES.system;
}
