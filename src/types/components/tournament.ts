/**
 * @file Tournament-related component type definitions
 * @description Types for tournament, bracket, and competition-related UI components
 */

import { type TournamentSummary } from "../app";
import { type BracketMatch, type ModelResponse, type TournamentPhase } from "../tournament";

/** Props for components that display tournament/evaluation data */
export interface TournamentDisplayProps {
  tournamentId: string;
  phase: TournamentPhase;
  modelResponses?: Record<string, ModelResponse>;
}

/** Props for tournament bracket */
export interface TournamentBracketProps {
  matches: BracketMatch[];
  currentRound: number;
  totalRounds: number;
  bracketSize: number;
  modelNames?: Record<string, string>;
  modelResponses?: Record<string, ModelResponse>;
  className?: string;
}

/** Props for round data */
export interface RoundData {
  round: number;
  matches: BracketMatch[];
  isActive: boolean;
}

/** Props for match result */
export interface MatchResultProps {
  match: BracketMatch;
  modelNames?: Record<string, string>;
  modelResponses?: Record<string, ModelResponse>;
  isCurrentRound?: boolean;
  className?: string;
  onShowJudgeEval?: () => void;
}

/** Props for progress indicator */
export interface ProgressIndicatorProps {
  phase: TournamentPhase;
  progress: number; // 0-100
  currentRound: number;
  totalRounds: number;
  winner?: string;
  className?: string;
}

/** Props for dashboard table */
export interface DashboardTableProps {
  tournaments: TournamentSummary[];
  currentUserId?: string;
}

/** Props for fork button */
export interface ForkButtonProps {
  tournamentId: string;
  className?: string;
}
