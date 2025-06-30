/**
 * @file Type definitions for the hierarchical tagging taxonomy system.
 * @description Provides type-safe interfaces and unions for working with the AI capability taxonomy.
 */

/**
 * Represents a single tag in the hierarchical taxonomy.
 * @interface TaxonomyTag
 */
export interface TaxonomyTag {
  /** Unique identifier for the tag (e.g., "scene-understanding") */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Detailed description of what this capability represents */
  description: string;
  /** Parent tag ID (undefined for L1 pillars) */
  parentId?: string | undefined;
}

/**
 * Enhanced taxonomy node with leading model and statistics for tree visualization.
 * Extends TaxonomyTag with additional data for the taxonomy tree page.
 * @interface TaxonomyNode
 */
export interface TaxonomyNode {
  id: string;
  name: string;
  description: string;
  parentId?: string | undefined;
  level: 1 | 2 | 3;
  leadingModel?:
    | {
        modelId: string;
        modelName: string;
        provider: string;
        eloScore: number;
        rank: number;
      }
    | undefined;
  stats?:
    | {
        totalModels: number;
        totalMatches: number;
        averageElo: number;
      }
    | undefined;
  children?: TaxonomyNode[] | undefined;
}

/**
 * Union type for all valid hierarchical tag IDs.
 * This will be populated at build time with the actual tag IDs.
 * @type HierarchicalTagId
 */
export type HierarchicalTagId = string;
// Will be refined to specific union type at runtime

/**
 * Represents tag metadata with hierarchical context.
 * Used for displaying tags with their full lineage information.
 * @interface
 */
export interface TagWithLineage {
  /** The leaf tag information */
  tag: TaxonomyTag;
  /** Complete path from root pillar to this leaf */
  lineage: TaxonomyTag[];
  /** Formatted breadcrumb string (e.g., "Perception > Visual Processing > Scene Understanding") */
  breadcrumb: string;
}

/**
 * Validation result for tag operations.
 * @interface
 */
export interface TagValidationResult {
  /** Array of valid tag IDs */
  validTags: HierarchicalTagId[];
  /** Array of invalid tag names that couldn't be matched */
  invalidTags: string[];
  /** Whether at least one valid tag was found */
  success: boolean;
}

/**
 * Tag frequency data for analytics and display.
 * @interface
 */
export interface TagFrequency {
  /** The tag ID */
  tagId: HierarchicalTagId;
  /** Number of tournaments with this tag */
  count: number;
  /** Percentage of total tournaments */
  percentage: number;
}

/**
 * Tag performance metrics for model evaluation.
 * @interface
 */
export interface TagPerformance {
  /** The tag ID */
  tagId: HierarchicalTagId;
  /** Win rate for this tag (0-1) */
  winRate: number;
  /** Total number of matches for this tag */
  totalMatches: number;
  /** Number of wins for this tag */
  wins: number;
  /** Percentile ranking compared to other models on this tag */
  percentile: number;
}
