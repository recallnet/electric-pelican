/**
 * @file Model execution module.
 * @description Provides functions for executing AI models and managing their responses.
 * This module handles parallel execution, retries, and progress tracking.
 */

import { ModelResponse } from "@/types/tournament";

import { trackModelFailure, trackModelSuccess } from "./model-failure-tracker";
import { callOpenRouter } from "./openrouter-client";

/** Maximum number of retries for model execution (3 total attempts: 1 initial + 2 retries) */
const MAX_MODEL_RETRIES = 2;

/**
 * Execute a single model with the challenge prompt with retry logic.
 * @description Executes a model with automatic retries and failure tracking.
 * Includes exponential backoff between retries and tracks model reliability.
 *
 * @param modelId - ID of the model to execute
 * @param challengePrompt - The prompt to send to the model
 * @returns Promise resolving to the model's response with success/failure status
 */
export async function executeModel(
  modelId: string,
  challengePrompt: string,
): Promise<ModelResponse> {
  let attempts = 0;
  let lastError = "";

  while (attempts <= MAX_MODEL_RETRIES) {
    attempts++;
    const timestamp = Date.now();

    try {
      console.log(`[model] Attempt ${attempts}/${MAX_MODEL_RETRIES + 1} for ${modelId}`);

      const response = await callOpenRouter({
        model: modelId,
        messages: [
          {
            role: "user",
            content: challengePrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        lastError = "Empty response from model";
        const error = new Error(lastError);

        // Track failure for empty responses
        await trackModelFailure(modelId, error);

        throw error;
      }

      // Success! Track it
      await trackModelSuccess(modelId);

      console.log(`[model] ✅ ${modelId} succeeded on attempt ${attempts}`);
      return {
        response: content,
        status: "success",
        timestamp,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.error(`[model] ❌ ${modelId} failed attempt ${attempts}: ${lastError}`);

      // Track model failure
      await trackModelFailure(modelId, error);

      if (attempts <= MAX_MODEL_RETRIES) {
        const backoffMs = attempts * 1000; // 1s, 2s, 3s backoff
        console.log(`[model] ⏳ Retrying ${modelId} in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  console.log(`[model] 🏳️ ${modelId} forfeited after ${attempts} attempts`);
  return {
    response: "",
    status: "failed",
    error: lastError,
    timestamp: Date.now(),
  };
}

/**
 * Execute multiple models in parallel with the same challenge prompt.
 * @description Executes multiple models simultaneously, each with its own retry logic.
 * Models that fail all retries will be marked as forfeited but won't block the tournament.
 *
 * @param models - Array of model IDs to execute
 * @param challengePrompt - The prompt to send to all models
 * @returns Promise resolving to a map of model IDs to their responses
 * @throws Error if challenge prompt is empty or fewer than 2 models succeed
 */
export async function executeModelsParallel(
  models: string[],
  challengePrompt: string,
): Promise<Record<string, ModelResponse>> {
  if (models.length === 0) {
    return {};
  }

  if (!challengePrompt.trim()) {
    throw new Error("Challenge prompt cannot be empty");
  }

  console.log(
    `[execution] Starting parallel execution of ${models.length} models with retry logic...`,
  );

  // Execute all models in parallel with individual retry logic
  const results = await Promise.allSettled(
    models.map(async (modelId) => ({
      modelId,
      response: await executeModel(modelId, challengePrompt),
    })),
  );

  // Convert results to response map
  const responses: Record<string, ModelResponse> = {};
  let successfulModels = 0;
  let forfeitedModels = 0;

  results.forEach((result, index) => {
    const modelId = models[index]!;

    if (result.status === "fulfilled") {
      responses[modelId] = result.value.response;
      if (result.value.response.status === "success") {
        successfulModels++;
      } else {
        forfeitedModels++;
      }
    } else {
      // Handle case where Promise.allSettled catches errors (shouldn't happen with our retry logic)
      console.error(`[execution] Promise.allSettled caught error for ${modelId}:`, result.reason);
      responses[modelId] = {
        response: "",
        status: "failed",
        error: result.reason?.message || "Execution failed",
        timestamp: Date.now(),
      };
      forfeitedModels++;
    }
  });

  console.log(`[execution] 📊 Model Execution Summary:`);
  console.log(`[execution]   ✅ Successful: ${successfulModels}/${models.length}`);
  console.log(`[execution]   🏳️ Forfeited: ${forfeitedModels}/${models.length}`);

  // Check if we have enough successful models to continue
  if (successfulModels < 2) {
    throw new Error(
      `Not enough successful models (${successfulModels}) to run tournament. Need at least 2.`,
    );
  }

  return responses;
}

/**
 * Calculate progress percentage for model execution.
 * @description Returns a percentage (0-100) based on completed vs total models.
 * Used for tracking and displaying execution progress.
 *
 * @param responses - Map of model IDs to their responses
 * @param totalModels - Total number of models being executed
 * @returns Progress percentage between 0 and 100
 */
export function calculateProgress(
  responses: Record<string, ModelResponse>,
  totalModels: number,
): number {
  const completedModels = Object.keys(responses).length;
  return Math.round((completedModels / totalModels) * 100);
}

/**
 * Check if all models have completed execution.
 * @description Verifies that all models have either succeeded or failed.
 * Used to determine when execution phase is complete.
 *
 * @param responses - Map of model IDs to their responses
 * @param models - Array of model IDs to check
 * @returns True if all models have completed, false otherwise
 */
export function allModelsCompleted(
  responses: Record<string, ModelResponse>,
  models: string[],
): boolean {
  return models.every((modelId) => responses[modelId] !== undefined);
}
