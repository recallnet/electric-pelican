import type { HierarchicalTagId } from "./taxonomy";

/**
 * Model's ELO score for a specific capability tag.
 */
export interface ModelTagScore {
  /** Model identifier */
  modelId: string;
  /** Capability tag identifier */
  tagId: HierarchicalTagId;
  /** ELO score for this tag */
  eloScore: number;
  /** Number of matches played for this tag */
  matchesPlayed: number;
  /** Number of wins for this tag */
  wins: number;
  /** Number of losses for this tag */
  losses: number;
  /** Win rate for this tag */
  winRate: number;
  /** Rank among all models for this tag */
  rank: number;
  /** Last match timestamp */
  lastActive: string;
}

/**
 * ELO update for a specific tag.
 */
export interface TagELOUpdate {
  /** Model identifier */
  modelId: string;
  /** Tag identifier */
  tagId: HierarchicalTagId;
  /** ELO score before update */
  oldScore: number;
  /** ELO score after update */
  newScore: number;
  /** Change in ELO score */
  change: number;
}

/**
 * Hierarchical ELO update result.
 */
export interface HierarchicalELOUpdate {
  /** Model identifier */
  modelId: string;
  /** All tag-specific updates (leaf + parents) */
  tagUpdates: TagELOUpdate[];
  /** Global ELO update (for backward compatibility) */
  globalUpdate: {
    oldScore: number;
    newScore: number;
    change: number;
  };
}

/**
 * Parameters for updating hierarchical ELO scores.
 */
export interface UpdateHierarchicalELOParams {
  /** Tournament run identifier */
  tournamentRunId: string;
  /** Round number in the tournament */
  roundNumber: number;
  /** Model ID of the winner */
  winnerModelId: string;
  /** Model ID of the loser */
  loserModelId: string;
  /** Tournament tag IDs (leaf tags) */
  tournamentTagIds: HierarchicalTagId[];
  /** Result type for this match */
  resultType?: "judged" | "forfeit" | "random_advance";
}
