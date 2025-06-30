/**
 * @file Canonical AI capability taxonomy for hierarchical tagging system.
 * @description Contains the complete three-level taxonomy of AI capabilities.
 * This file re-exports the taxonomy from the modular pillar structure.
 */

import type { TaxonomyTag } from "@/types/taxonomy";

// Re-export for convenience
export type { TaxonomyTag };

// Import the complete taxonomy from the pillar structure
export { HIERARCHICAL_TAXONOMY } from "./pillars";

// Calculate and export leaf IDs (L3 tags that can be assigned to tournaments)
import { HIERARCHICAL_TAXONOMY as TAXONOMY } from "./pillars";

/**
 * Array of all leaf tag IDs (L3 tags that can be assigned to tournaments).
 * A tag is a leaf if no other tag has it as a parent.
 */
export const leafIds = TAXONOMY.filter((tag) => {
  // A tag is a leaf if no other tag has it as a parent
  return !TAXONOMY.some((otherTag) => otherTag.parentId === tag.id);
}).map((tag) => tag.id);
