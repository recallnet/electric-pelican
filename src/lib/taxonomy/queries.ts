/**
 * @file Tag query and navigation functions.
 * @description Functions for querying and navigating the taxonomy hierarchy.
 */

import type { TaxonomyTag } from "@/types/taxonomy";

import { HIERARCHICAL_TAXONOMY, leafIds } from "./data";

/**
 * Get information about a specific tag by ID.
 * @param id - The tag ID to look up
 * @returns The tag information or undefined if not found
 * @example
 * ```ts
 * const tag = getTagInfo('scene-understanding');
 * console.log(tag?.name); // "Scene Understanding"
 * ```
 */
export function getTagInfo(id: string): TaxonomyTag | undefined {
  return HIERARCHICAL_TAXONOMY.find((tag) => tag.id === id);
}

/**
 * Get the complete lineage (path from root to leaf) for a tag.
 * @param id - The tag ID to get lineage for
 * @returns Array of tags from root pillar to the specified tag
 * @example
 * ```ts
 * const lineage = getTagLineage('scene-understanding');
 * // Returns: [perception-understanding, visual-processing, scene-understanding]
 * ```
 */
export function getTagLineage(id: string): TaxonomyTag[] {
  const lineage: TaxonomyTag[] = [];
  let currentId: string | undefined = id;

  while (currentId) {
    const tag = getTagInfo(currentId);
    if (!tag) break;

    lineage.unshift(tag);
    currentId = tag.parentId;
  }

  return lineage;
}

/**
 * Get all child tags for a given parent tag.
 * @param parentId - The parent tag ID
 * @returns Array of child tags
 * @example
 * ```ts
 * const children = getChildTags('visual-processing');
 * // Returns all L3 tags under visual-processing
 * ```
 */
export function getChildTags(parentId: string): TaxonomyTag[] {
  return HIERARCHICAL_TAXONOMY.filter((tag) => tag.parentId === parentId);
}

/**
 * Get all tags at a specific level in the hierarchy.
 * @param level - The level (1 for pillars, 2 for families, 3 for leaves)
 * @returns Array of tags at the specified level
 * @example
 * ```ts
 * const pillars = getTagsByLevel(1); // All L1 pillar tags
 * const leaves = getTagsByLevel(3);  // All L3 leaf tags
 * ```
 */
export function getTagsByLevel(level: 1 | 2 | 3): TaxonomyTag[] {
  switch (level) {
    case 1:
      return HIERARCHICAL_TAXONOMY.filter((tag) => !tag.parentId);
    case 2:
      return HIERARCHICAL_TAXONOMY.filter((tag) => {
        if (!tag.parentId) return false;
        const parent = getTagInfo(tag.parentId);
        return parent && !parent.parentId;
      });
    case 3:
      return HIERARCHICAL_TAXONOMY.filter((tag) => isLeaf(tag.id));
    default:
      return [];
  }
}

/**
 * Check if a tag is a leaf node (can be assigned to tournaments).
 * @param id - The tag ID to check
 * @returns True if the tag is a leaf node
 * @example
 * ```ts
 * console.log(isLeaf('scene-understanding')); // true
 * console.log(isLeaf('visual-processing')); // false (has children)
 * ```
 */
export function isLeaf(id: string): boolean {
  return leafIds.includes(id);
}
