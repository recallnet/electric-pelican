/**
 * Model Failure Tracking System
 *
 * Tracks model failures during tournament execution and automatically marks
 * models as unavailable after reaching the failure threshold. Uses smart
 * error classification to avoid penalizing models for temporary or user-caused issues.
 */

import { count, eq, gte } from "drizzle-orm";

import { db } from "../../db";
import { models } from "../../db/schema";
import { classifyOpenRouterError } from "./model-error-classifier";

const FAILURE_THRESHOLD = 3;
const FAILURE_RESET_HOURS = 24; // Reset failure count after 24 hours of no failures

/**
 * Tracks a model failure and potentially marks it as unavailable.
 * Only tracks failures that indicate permanent model issues.
 *
 * @param modelId - OpenRouter model ID
 * @param error - Error object from the failed API call
 */
export async function trackModelFailure(modelId: string, error: unknown): Promise<void> {
  const classification = classifyOpenRouterError(error);

  // Don't track failures that shouldn't mark model as unavailable
  if (!classification.shouldMarkUnavailable) {
    console.log(`[Model Failure] Not tracking failure for ${modelId}: ${classification.reason}`);
    return;
  }

  try {
    // Get current model state
    const model = await db.select().from(models).where(eq(models.id, modelId)).limit(1);

    if (model.length === 0) {
      console.error(`[Model Failure] Model ${modelId} not found in database`);
      return;
    }

    const currentModel = model[0];
    if (!currentModel) {
      console.error(`[Model Failure] Model ${modelId} data not found`);
      return;
    }

    const now = new Date();

    // Reset failure count if last failure was more than 24 hours ago
    const shouldResetCount =
      currentModel.last_failure_at &&
      now.getTime() - currentModel.last_failure_at.getTime() > FAILURE_RESET_HOURS * 60 * 60 * 1000;

    const newFailureCount = shouldResetCount ? 1 : (currentModel.failure_count || 0) + 1;
    const shouldMarkUnavailable = newFailureCount >= FAILURE_THRESHOLD;

    console.log(
      `[Model Failure] ${modelId} failure ${newFailureCount}/${FAILURE_THRESHOLD}: ${classification.reason}`,
    );

    // Update model failure tracking
    await db
      .update(models)
      .set({
        failure_count: newFailureCount,
        last_failure_at: now,
        ...(shouldMarkUnavailable && {
          is_available: false,
          unavailable_reason: classification.reason,
          marked_unavailable_at: now,
        }),
      })
      .where(eq(models.id, modelId));

    if (shouldMarkUnavailable) {
      console.warn(
        `[Model Failure] Marked ${modelId} as unavailable after ${FAILURE_THRESHOLD} failures`,
      );
    }
  } catch (dbError) {
    console.error(`[Model Failure] Database error while tracking failure for ${modelId}:`, dbError);
  }
}

/**
 * Tracks a successful model execution and resets failure count.
 *
 * @param modelId - OpenRouter model ID that executed successfully
 */
export async function trackModelSuccess(modelId: string): Promise<void> {
  try {
    // Reset failure count on successful execution
    await db
      .update(models)
      .set({
        failure_count: 0,
        last_failure_at: null,
      })
      .where(eq(models.id, modelId));

    console.log(`[Model Success] Reset failure count for ${modelId}`);
  } catch (error) {
    console.error(`[Model Success] Database error while tracking success for ${modelId}:`, error);
  }
}

/**
 * Gets failure statistics for a specific model.
 *
 * @param modelId - OpenRouter model ID
 * @returns Model availability and failure information
 */
export async function getModelFailureInfo(modelId: string): Promise<{
  is_available: boolean;
  failure_count: number;
  last_failure_at: Date | null;
  unavailable_reason: string | null;
  marked_unavailable_at: Date | null;
} | null> {
  try {
    const model = await db
      .select({
        is_available: models.is_available,
        failure_count: models.failure_count,
        last_failure_at: models.last_failure_at,
        unavailable_reason: models.unavailable_reason,
        marked_unavailable_at: models.marked_unavailable_at,
      })
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1);

    return model.length > 0 ? (model[0] ?? null) : null;
  } catch (error) {
    console.error(`[Model Failure Info] Database error for ${modelId}:`, error);
    return null;
  }
}

/**
 * Gets all currently unavailable models with their failure reasons.
 *
 * @returns Array of unavailable models with failure details
 */
export async function getUnavailableModels(): Promise<
  Array<{
    id: string;
    name: string;
    provider: string;
    failure_count: number;
    last_failure_at: Date | null;
    unavailable_reason: string | null;
    marked_unavailable_at: Date | null;
  }>
> {
  try {
    return await db
      .select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        failure_count: models.failure_count,
        last_failure_at: models.last_failure_at,
        unavailable_reason: models.unavailable_reason,
        marked_unavailable_at: models.marked_unavailable_at,
      })
      .from(models)
      .where(eq(models.is_available, false))
      .orderBy(models.marked_unavailable_at);
  } catch (error) {
    console.error(`[Model Failure Info] Database error getting unavailable models:`, error);
    return [];
  }
}

/**
 * Manually marks a model as available (admin recovery function).
 *
 * @param modelId - OpenRouter model ID to restore
 * @param reason - Optional reason for restoration
 */
export async function markModelAvailable(modelId: string, reason?: string): Promise<void> {
  try {
    await db
      .update(models)
      .set({
        is_available: true,
        failure_count: 0,
        last_failure_at: null,
        unavailable_reason: reason ? `Manually restored: ${reason}` : null,
        marked_unavailable_at: null,
      })
      .where(eq(models.id, modelId));

    console.log(`[Model Recovery] Marked ${modelId} as available${reason ? `: ${reason}` : ""}`);
  } catch (error) {
    console.error(`[Model Recovery] Database error while restoring ${modelId}:`, error);
  }
}

/**
 * Gets overall model failure statistics.
 *
 * @returns Statistics about model availability and failures
 */
export async function getModelFailureStats(): Promise<{
  total: number;
  available: number;
  unavailable: number;
  recentFailures: number;
  availabilityRate: number;
}> {
  try {
    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(models);

    // Get unavailable count
    const [unavailableResult] = await db
      .select({ count: count() })
      .from(models)
      .where(eq(models.is_available, false));

    // Get recent failures count (last 24 hours)
    const [recentFailuresResult] = await db
      .select({ count: count() })
      .from(models)
      .where(gte(models.last_failure_at, new Date(Date.now() - 24 * 60 * 60 * 1000)));

    const total = totalResult?.count || 0;
    const unavailable = unavailableResult?.count || 0;
    const available = total - unavailable;
    const recentFailures = recentFailuresResult?.count || 0;

    return {
      total,
      available,
      unavailable,
      recentFailures,
      availabilityRate: total > 0 ? (available / total) * 100 : 100,
    };
  } catch (error) {
    console.error(`[Model Failure Stats] Database error:`, error);
    return {
      total: 0,
      available: 0,
      unavailable: 0,
      recentFailures: 0,
      availabilityRate: 0,
    };
  }
}
