import { eq } from "drizzle-orm";

import type { RouterExecutionResult } from "@/types/router-results";

import { db } from "../../../db";
import { routerExecutionResults } from "../../../db/schema";

/**
 * Transform database result to API format
 */
function transformDbResultToApi(
  dbResult: typeof routerExecutionResults.$inferSelect,
): RouterExecutionResult {
  return dbResult as unknown as RouterExecutionResult;
}

/**
 * Get recent public results for analytics
 */
export async function getRecentResults(limit = 10): Promise<RouterExecutionResult[]> {
  const results = await db
    .select()
    .from(routerExecutionResults)
    .where(eq(routerExecutionResults.isPublic, true))
    .orderBy(routerExecutionResults.completedAt)
    .limit(limit);

  return results.map(transformDbResultToApi);
}

/**
 * Get results for a specific user
 */
export async function getUserResults(userId: string, limit = 20): Promise<RouterExecutionResult[]> {
  const results = await db
    .select()
    .from(routerExecutionResults)
    .where(eq(routerExecutionResults.userId, userId))
    .orderBy(routerExecutionResults.completedAt)
    .limit(limit);

  return results.map(transformDbResultToApi);
}
