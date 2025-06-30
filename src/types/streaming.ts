/**
 * @file Streaming-related type definitions
 * @description Types for Router-3B streaming functionality
 */

import type { ExecutionEvent, StreamingPreferences } from "./router";
import { ModelResponse, TournamentBracket } from "./tournament";

/**
 * Progress update for streaming tournament execution
 */
export interface StreamingProgress {
  /** Type of progress event */
  type: "model_completed" | "match_judged" | "round_completed" | "tournament_completed";

  /** ID of the model that completed execution (for model_completed events) */
  modelId?: string;

  /** ID of the match that was judged (for match_judged events) */
  matchId?: string;

  /** Current round number (for round_completed events) */
  round?: number;

  /** ID of the winning model (for match_judged events) */
  winner?: string;

  /** Explanation from the judge for the decision */
  judgeExplanation?: string;

  /** Number of models that have completed execution */
  totalModelsCompleted: number;

  /** Number of models still being executed */
  totalModelsRunning: number;

  /** Number of matches that have been judged */
  totalMatchesJudged: number;

  /** Number of matches ready for judging */
  totalMatchesReady: number;

  /** Current round number in the tournament */
  currentRound: number;

  /** Overall status of the tournament */
  tournamentStatus: "models_executing" | "judging" | "completed";
}

/**
 * Internal state for streaming tournament execution
 */
export interface StreamingTournamentState {
  /** Current bracket state */
  bracket: TournamentBracket;

  /** Responses from all models */
  modelResponses: Record<string, ModelResponse>;

  /** Set of models currently executing */
  pendingModels: Set<string>;

  /** Set of models that have completed execution */
  completedModels: Set<string>;

  /** Matches ready for judging */
  readyMatches: Array<{ matchId: string; modelA: string; modelB: string }>;

  /** Set of matches that have been judged */
  judgedMatches: Set<string>;

  /** Set of matches currently being judged to prevent race conditions */
  judgingMatches: Set<string>;

  /** Whether the tournament is complete */
  isComplete: boolean;

  /** Current round number */
  currentRound: number;

  /** Timestamp when the tournament started */
  tournamentStartTime: number;

  /** Map of match IDs to their start timestamps */
  matchStartTimes: Map<string, number>;

  /** Set of matches that have been forced to complete due to timeout */
  stuckMatches: Set<string>;
}

/**
 * Event handler type for streaming events
 */
export type StreamingEventHandler = (event: ExecutionEvent) => void;

/**
 * Connection state for tracking streaming connections
 */
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

/**
 * Configuration options for streaming clients
 */
export interface StreamingClientOptions {
  preferences?: Partial<StreamingPreferences>;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onConnectionStateChange?: ((state: ConnectionState) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
}

/**
 * Streaming client utility handlers
 */
export interface StreamingUtilityHandlers {
  onProgress?: (data: any) => void;
  onIntermediate?: (data: any) => void;
  onComplete?: (data: any) => void;
  onError?: (data: any) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}
