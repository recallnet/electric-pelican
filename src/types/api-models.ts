/**
 * API contract types for models, leaderboard and ELO data
 */

/**
 * Model's ELO rating and performance statistics.
 */
export interface ModelScore {
  /** ID of the model */
  modelId: string;
  /** Global ELO rating score */
  globalScore: number;
  /** Total number of matches played */
  matchesPlayed: number;
  /** Number of matches won */
  wins: number;
  /** Number of matches lost */
  losses: number;
  /** Win rate percentage */
  winRate: number;
  /** Current rank in global leaderboard */
  rank: number;
  /** Timestamp of last match */
  lastActive: string;
}

/**
 * Result of a match between two models.
 */
export interface MatchResult {
  /** ID of the tournament run */
  tournamentRunId: string;
  /** Round number in the tournament */
  roundNumber: number;
  /** ID of the winning model */
  winnerModelId: string;
  /** ID of the losing model */
  loserModelId: string;
  /** Winner's ELO score before match */
  winnerScoreBefore: number;
  /** Loser's ELO score before match */
  loserScoreBefore: number;
  /** Winner's ELO score after match */
  winnerScoreAfter: number;
  /** Loser's ELO score after match */
  loserScoreAfter: number;
  /** Type of match result */
  resultType?: "judged" | "forfeit" | "random_advance";
  /** Timestamp of match completion */
  createdAt: string;
}

/**
 * Change in a model's ELO rating.
 */
export interface ELOUpdate {
  /** ID of the model */
  modelId: string;
  /** ELO score before update */
  oldScore: number;
  /** ELO score after update */
  newScore: number;
  /** Change in ELO score */
  change: number;
}

/**
 * Type for challenge generator responses.
 */
export interface ChallengeGeneratorResponse {
  /** The generated challenge prompt */
  challenge: string;
}
