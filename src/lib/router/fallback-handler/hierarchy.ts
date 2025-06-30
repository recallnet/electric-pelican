/**
 * @file Capability hierarchy navigation for fallbacks
 * @description Handles parent capability lookups for fallback selection
 */

import type { ModelRecommendation } from "@/types/router";
import type { HierarchicalTagId } from "@/types/taxonomy";

import { getTagsByLevel } from "../../tag-taxonomy";
import { tryCapabilityFallback } from "./selection";

/**
 * Try fallback using parent capabilities in the hierarchy
 */
export async function tryParentCapabilityFallback(
  capabilities: HierarchicalTagId[],
  excludeModels: string[],
): Promise<ModelRecommendation | null> {
  try {
    // Get all tags to find parent relationships
    const leafTags = getTagsByLevel(3); // Get L3 leaf tags
    const leafTagIds = leafTags.map((tag) => tag.id);

    for (const capability of capabilities) {
      // Find parent capabilities
      const parentCapabilities = findParentCapabilities(capability, leafTagIds);

      for (const parentCap of parentCapabilities) {
        const fallback = await tryCapabilityFallback([parentCap], excludeModels);
        if (fallback) {
          fallback.reasoning = `Using parent capability ${parentCap} for ${capability}`;
          return fallback;
        }
      }
    }
  } catch (error) {
    console.warn("Parent capability fallback failed:", error);
  }

  return null;
}

/**
 * Find parent capabilities in the hierarchy
 */
function findParentCapabilities(
  capability: HierarchicalTagId,
  _allTags: HierarchicalTagId[],
): HierarchicalTagId[] {
  // Import here to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getTagLineage } = require("../../tag-taxonomy");

  try {
    const lineage = getTagLineage(capability);

    // Return all parents in the lineage (excluding the capability itself)
    return lineage.slice(0, -1).map((tag: { id: string }) => tag.id as HierarchicalTagId);
  } catch (error) {
    console.warn(`Failed to get tag lineage for ${capability}:`, error);
    return [];
  }
}
