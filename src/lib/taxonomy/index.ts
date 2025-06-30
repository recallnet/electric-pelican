/**
 * @file Taxonomy system unified export.
 * @description Re-exports all taxonomy functions and data for backward compatibility.
 */

// Re-export everything with original names for backward compatibility
export type { TaxonomyTag } from "./data";
export { leafIds, HIERARCHICAL_TAXONOMY as TAGS } from "./data";
export { getChildTags, getTagInfo, getTagLineage, getTagsByLevel, isLeaf } from "./queries";
