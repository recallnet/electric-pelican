import { sql } from "drizzle-orm";

import { getTagInfo } from "@/lib/tag-taxonomy";
import type { CapabilityMeasurement } from "@/types/capability-analytics";
import type { HierarchicalTagId } from "@/types/taxonomy";

/**
 * Get the least-measured capabilities in the system
 */
export async function getLeastMeasuredCapabilities(
  limit: number = 3,
): Promise<CapabilityMeasurement[]> {
  const { db } = await import("../../db");

  const query = sql`
    SELECT
      tag_id,
      COUNT(DISTINCT model_id) as total_models,
      SUM(matches_played) as total_matches,
      CASE
        WHEN COUNT(DISTINCT model_id) > 0
        THEN CAST(SUM(matches_played) / COUNT(DISTINCT model_id) AS INTEGER)
        ELSE 0
      END as avg_matches_per_model
    FROM model_tag_scores
    WHERE matches_played > 0
    GROUP BY tag_id
    ORDER BY avg_matches_per_model ASC, tag_id ASC
    LIMIT ${limit}
  `;

  const results = await db.execute(query);
  const rows = Array.isArray(results) ? results : results.rows || [];

  return rows.map((row: any) => {
    const tagInfo = getTagInfo(row.tag_id);
    return {
      tagId: row.tag_id as HierarchicalTagId,
      tagName: tagInfo?.name || row.tag_id,
      tagDescription: tagInfo?.description || "",
      avgMatchesPerModel: Number(row.avg_matches_per_model || 0),
      totalModels: Number(row.total_models || 0),
      totalMatches: Number(row.total_matches || 0),
    };
  });
}

/**
 * Get capabilities that have never been measured
 */
export async function getUnmeasuredCapabilities(): Promise<HierarchicalTagId[]> {
  const { db } = await import("../../db");
  const { leafIds } = await import("@/lib/tag-taxonomy");

  const query = sql`
    SELECT DISTINCT tag_id
    FROM model_tag_scores
    WHERE matches_played > 0
  `;

  const results = await db.execute(query);
  const measuredTags = new Set(
    (Array.isArray(results) ? results : results.rows || []).map((row: any) => row.tag_id),
  );

  return leafIds.filter((tagId) => !measuredTags.has(tagId));
}

/**
 * Get comprehensive capability coverage statistics
 */
export async function getCapabilityCoverage() {
  const { leafIds } = await import("@/lib/tag-taxonomy");
  const leastMeasured = await getLeastMeasuredCapabilities(10);
  const unmeasured = await getUnmeasuredCapabilities();

  return {
    totalCapabilities: leafIds.length,
    measuredCapabilities: leafIds.length - unmeasured.length,
    unmeasuredCapabilities: unmeasured.length,
    coveragePercentage: ((leafIds.length - unmeasured.length) / leafIds.length) * 100,
    leastMeasured,
    unmeasured,
  };
}
