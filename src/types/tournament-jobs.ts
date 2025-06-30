/**
 * Type definitions for tournament background jobs
 */

import type { Tournament } from "../../db";

/**
 * Tournament with metadata used in background jobs
 */
export interface TournamentWithMetadata extends Tournament {
  /** The prompt used for the tournament */
  prompt: string;
  /** The prompt used for judging model responses */
  judgePrompt?: string;
  /** The model used for judging */
  judgeModel: string;
}
