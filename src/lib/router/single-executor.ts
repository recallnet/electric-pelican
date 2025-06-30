/**
 * @file Single model executor for Router-3A
 * @description Executes prompts using a single recommended model as baseline/fallback
 */

import type { CompletionResult, ExecutionOptions, ModelRecommendation } from "@/types/router";

import { executeStepWithRetry } from "./error-recovery";
import { createModelExecutor } from "./model-executor";

/**
 * Execute a prompt with a single model
 */
export async function executeSingleModel(
  prompt: string,
  model: ModelRecommendation,
  options: ExecutionOptions = {},
): Promise<CompletionResult> {
  const startTime = Date.now();
  const modelExecutor = createModelExecutor();

  try {
    // Create a single "step" for the entire prompt
    const singleStep = {
      id: "single-model-execution",
      description: "Execute entire prompt with single model",
      requiredCapabilities: model.selectedForCapability
        ? [model.selectedForCapability]
        : ["general"],
      primaryCapability: model.selectedForCapability || "general",
      selectedModel: model,
      dependencies: [],
      estimatedTokens: estimatePromptTokens(prompt),
      priority: 1,
    };

    // Execute with retry logic
    const result = await executeStepWithRetry(singleStep, prompt, modelExecutor, options);

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      duration,
      modelUsed: model.modelId,
      metadata: {
        approach: "single-model",
        modelName: model.modelName,
        provider: model.provider,
        eloScore: model.eloScore,
        reasoning: model.reasoning,
        success: result.success,
        attempts: result.attempt,
      },
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      tokensUsed: 0,
      cost: 0,
      duration,
      modelUsed: model.modelId,
      metadata: {
        approach: "single-model",
        modelName: model.modelName,
        provider: model.provider,
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
    };
  }
}

/**
 * Estimate tokens in a prompt (rough approximation)
 */
function estimatePromptTokens(prompt: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(prompt.length / 4);
}

/**
 * Validate single model execution requirements
 */
export function validateSingleModelExecution(
  prompt: string,
  model: ModelRecommendation,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!prompt || prompt.trim().length === 0) {
    errors.push("Prompt is required and cannot be empty");
  }

  if (!model) {
    errors.push("Model recommendation is required");
  } else {
    if (!model.modelId) {
      errors.push("Model ID is required");
    }

    if (!model.modelName) {
      errors.push("Model name is required");
    }

    if (!model.eloScore || model.eloScore < 0) {
      errors.push("Model must have a valid ELO score");
    }
  }

  const estimatedTokens = estimatePromptTokens(prompt);
  if (estimatedTokens > 100000) {
    errors.push("Prompt is too long for single model execution");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get single model execution statistics
 */
export function calculateSingleModelStats(result: CompletionResult): {
  efficiency: number;
  costEffectiveness: number;
  qualityScore: number;
} {
  const contentLength = result.content.length;
  const tokensPerSecond = result.tokensUsed / (result.duration / 1000);
  const costPerToken = result.cost / result.tokensUsed;

  return {
    // Efficiency based on tokens per second
    efficiency: Math.min(1, tokensPerSecond / 100), // Normalize to reasonable range

    // Cost effectiveness (lower cost per token is better)
    costEffectiveness: Math.max(0, 1 - costPerToken / 0.01), // Normalize to $0.01 per token

    // Quality score based on content length (simple heuristic)
    qualityScore: Math.min(1, contentLength / 1000), // Normalize to 1000 characters
  };
}
