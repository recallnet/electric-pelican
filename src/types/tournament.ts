/**
 * @file Tournament type definitions.
 * @description Contains all type definitions for tournament-related data structures,
 * including brackets, matches, requests, and responses. These types form the core
 * data model for the tournament system and are used throughout the application.
 */

import type { HierarchicalTagId } from "./taxonomy";

/**
 * Represents a single match in a tournament bracket.
 * @interface
 * @description A match represents a competition between two models in a specific round
 * and position within the tournament bracket. It tracks the participating models and
 * the winner once determined.
 * @example
 * ```ts
 * const match: BracketMatch = {
 *   id: 'match123',
 *   round: 1,
 *   position: 1,
 *   modelA: 'gpt-4',
 *   modelB: 'claude-2',
 *   winner: 'gpt-4',
 *   judgeExplanation: 'GPT-4 provided more accurate and detailed responses'
 * };
 * ```
 */
export interface BracketMatch {
  /** Unique identifier for the match */
  id: string;
  /** Round number (1-indexed) */
  round: number;
  /** Position within the round */
  position: number;
  /** ID of first model in match, null if bye */
  modelA: string | null;
  /** ID of second model in match, null if bye */
  modelB: string | null;
  /** ID of winning model, null if not played */
  winner: string | null;
  /** Explanation from judge about the winner selection */
  judgeExplanation?: string;
}

/**
 * Represents the complete state of a tournament bracket.
 * @interface
 * @description The tournament bracket is the central data structure that tracks
 * all matches, their progression, and the overall state of the tournament.
 * It supports single-elimination tournaments with 4, 8, or 16 participants.
 * @example
 * ```ts
 * const bracket: TournamentBracket = {
 *   tournamentId: 'tournament123',
 *   bracketSize: 4,
 *   totalRounds: 2,
 *   matches: [...],
 *   status: 'running',
 *   currentRound: 1,
 *   modelResponses: { ... }
 * };
 * ```
 */
export interface TournamentBracket {
  /** ID of the tournament this bracket belongs to */
  tournamentId: string;
  /** Number of models in the tournament (4, 8, or 16) */
  bracketSize: number;
  /** Total number of rounds (log2 of bracketSize) */
  totalRounds: number;
  /** All matches across all rounds */
  matches: BracketMatch[];
  /** Current status of the tournament */
  status: "created" | "running" | "completed" | "models_executed";
  /** Current round number (1-indexed) */
  currentRound: number;
  /** Model execution results, keyed by model ID */
  modelResponses?: Record<string, ModelResponse>;
}

/**
 * Request to create a new tournament bracket.
 * @interface
 * @description The input parameters required to initialize a new tournament.
 * The models array must contain 4, 8, or 16 unique model IDs, and a judge
 * model must be specified to evaluate the matches.
 * @example
 * ```ts
 * const request: CreateBracketRequest = {
 *   models: ['gpt-4', 'claude-2', 'palm-2', 'llama-2'],
 *   judgeModel: 'gpt-4'
 * };
 * ```
 */
export interface CreateBracketRequest {
  /** Array of 4, 8, or 16 model IDs to compete */
  models: string[];
  /** ID of the model that will judge matches */
  judgeModel: string;
}

/**
 * Response from bracket creation request.
 * @interface
 * @description The response from attempting to create a new tournament bracket.
 * Includes the created bracket on success or an error message on failure.
 * @example
 * ```ts
 * const response: CreateBracketResponse = {
 *   success: true,
 *   bracket: { ... }
 * };
 * ```
 */
export interface CreateBracketResponse {
  /** Whether the creation was successful */
  success: boolean;
  /** Created bracket if successful */
  bracket?: TournamentBracket;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Response from a model's execution.
 * @interface
 * @description Contains the result of executing a model with the challenge prompt.
 * Tracks both successful responses and failures, including error information
 * and timing data.
 * @example
 * ```ts
 * const response: ModelResponse = {
 *   response: "The model's answer to the challenge",
 *   status: "success",
 *   timestamp: 1234567890
 * };
 * ```
 */
export interface ModelResponse {
  /** Model's response to the challenge prompt */
  response: string;
  /** Execution status */
  status: "success" | "failed";
  /** Error message if failed */
  error?: string;
  /** Unix timestamp of execution */
  timestamp: number;
}

/**
 * Request to execute models in a tournament.
 * @interface
 * @description Parameters for executing multiple models with the same challenge prompt.
 * This initiates the actual competition phase where models generate their responses.
 * @example
 * ```ts
 * const request: ExecuteModelsRequest = {
 *   challengePrompt: "Explain quantum computing to a 5-year-old",
 *   models: ['gpt-4', 'claude-2'],
 *   judgeModel: 'gpt-4'
 * };
 * ```
 */
export interface ExecuteModelsRequest {
  /** The prompt that models will respond to */
  challengePrompt: string;
  /** Array of model IDs to execute */
  models: string[];
  /** ID of the model that will judge responses */
  judgeModel: string;
}

/**
 * Response from model execution request.
 * @interface
 * @description Status and results of executing multiple models.
 * Tracks progress and collects responses as they complete.
 * @example
 * ```ts
 * const response: ExecuteModelsResponse = {
 *   success: true,
 *   progress: 50,
 *   responses: {
 *     'gpt-4': { status: 'success', response: '...', timestamp: 1234567890 }
 *   }
 * };
 * ```
 */
export interface ExecuteModelsResponse {
  /** Whether the execution was successful */
  success: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Model responses if any completed */
  responses?: Record<string, ModelResponse>;
  /** Whether streaming execution was used */
  streamingEnabled?: boolean;
  /** Whether the tournament has been fully executed and judged */
  completed?: boolean;
  /** Total number of matches judged */
  totalMatches?: number;
  /** Final status of the tournament bracket */
  finalStatus?: string;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Result of a judged match between two models.
 * @interface
 * @description Contains the outcome of a judged match, including which model won
 * and why. The resultType indicates whether this was a normal judgment or
 * a special case like a forfeit.
 * @example
 * ```ts
 * const result: JudgeMatchup = {
 *   matchId: 'match123',
 *   modelA: 'gpt-4',
 *   modelB: 'claude-2',
 *   winner: 'gpt-4',
 *   judgeExplanation: 'GPT-4 provided more accurate and detailed responses',
 *   resultType: 'judged'
 * };
 * ```
 */
export interface JudgeMatchup {
  /** ID of the match that was judged */
  matchId: string;
  /** ID of first model in match */
  modelA: string;
  /** ID of second model in match */
  modelB: string;
  /** ID of winning model */
  winner: string;
  /** Judge's explanation for the winner selection */
  judgeExplanation: string;
  /** Type of result (normal judging, forfeit, or random) */
  resultType?: "judged" | "forfeit" | "random_advance";
}

/**
 * Request to judge tournament matches.
 * @interface
 * @description Parameters for judging one or more tournament matches.
 * Can optionally target a specific round and include context from the
 * challenge prompt.
 * @example
 * ```ts
 * const request: JudgeTournamentRequest = {
 *   judgePrompt: "Compare the responses and select the better answer...",
 *   currentRound: 1,
 *   challengePrompt: "Original challenge prompt for context",
 *   judgeModel: 'gpt-4'
 * };
 * ```
 */
export interface JudgeTournamentRequest {
  /** Prompt used to judge model responses */
  judgePrompt: string;
  /** Optional round number to judge */
  currentRound?: number;
  /** Optional challenge prompt for context */
  challengePrompt?: string;
  /** Optional override for judge model */
  judgeModel?: string;
}

/**
 * Response from tournament judging request.
 * @interface
 * @description Results of judging tournament matches, including whether
 * the tournament is now complete and who won each matchup.
 * @example
 * ```ts
 * const response: JudgeTournamentResponse = {
 *   success: true,
 *   tournamentComplete: false,
 *   currentRound: 1,
 *   matches: [{ matchId: 'match123', winner: 'gpt-4', ... }]
 * };
 * ```
 */
export interface JudgeTournamentResponse {
  /** Whether judging was successful */
  success: boolean;
  /** Whether the tournament is now complete */
  tournamentComplete: boolean;
  /** ID of tournament winner if complete */
  winner?: string;
  /** Current round number after judging */
  currentRound: number;
  /** Results of judged matches */
  matches: JudgeMatchup[];
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Response containing tournament status.
 * @interface
 * @description Comprehensive status information about a tournament,
 * including its current phase, progress, and all associated data.
 * This is the primary data structure for displaying tournament state.
 * @example
 * ```ts
 * const status: TournamentStatusResponse = {
 *   success: true,
 *   tournament: {
 *     id: 'tournament123',
 *     phase: 'judging',
 *     currentRound: 1,
 *     progress: 50,
 *     // ... other tournament data
 *   }
 * };
 * ```
 */
export interface TournamentStatusResponse {
  /** Whether status retrieval was successful */
  success: boolean;
  /** Tournament data if successful */
  tournament?: {
    /** Tournament ID */
    id: string;
    /** URL-friendly identifier */
    slug?: string;
    /** Human-readable title */
    title?: string;
    /** Current phase of the tournament */
    phase: "setup" | "executing_models" | "judging" | "completed" | "failed";
    /** Current round number */
    currentRound: number;
    /** Total number of rounds */
    totalRounds: number;
    /** Progress percentage (0-100) */
    progress: number;
    /** ID of winning model if complete */
    winner?: string;
    /** Number of models in tournament */
    bracketSize: number;
    /** All tournament matches */
    matches: BracketMatch[];
    /** Model execution results */
    modelResponses?: Record<string, ModelResponse>;
    /** Challenge prompt for models */
    prompt?: string;
    /** Prompt used for judging */
    judgePrompt?: string;
    /** Creation timestamp */
    createdAt?: string;
    /** ID of creator */
    createdBy?: string;
    /** Display name of creator */
    authorName?: string;
    /** ID of creator for linking */
    authorId?: string;
    /** Number of upvotes */
    upvoteCount?: number;
    /** Whether requesting user has upvoted */
    hasUpvoted?: boolean;
    /** ID of parent tournament if forked */
    parentId?: string | null;
    /** Number of forks */
    forkCount?: number;
    /** Hierarchical tag IDs */
    tagIds?: import("./taxonomy").HierarchicalTagId[];
    /** Participating model IDs */
    models?: string[];
    /** ID of judging model */
    judgeModel?: string;
  };
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Possible phases of a tournament.
 * @type
 * @description Enumeration of all possible states a tournament can be in,
 * from initial setup through completion or failure.
 * @example
 * ```ts
 * const phase: TournamentPhase = 'executing_models';
 * ```
 */
export type TournamentPhase = "setup" | "executing_models" | "judging" | "completed" | "failed";

/**
 * Complete tournament data structure.
 * @interface
 * @description The full tournament data model that includes all information
 * about a tournament. This is used for detailed views and persistence.
 * Combines metadata, bracket state, and execution results.
 * @example
 * ```ts
 * const tournament: Tournament = {
 *   id: 'tournament123',
 *   title: 'AI Model Showdown 2024',
 *   phase: 'completed',
 *   bracketSize: 4,
 *   matches: [...],
 *   winner: 'gpt-4',
 *   // ... other tournament data
 * };
 * ```
 */
export interface Tournament {
  /** Tournament ID */
  id: string;
  /** URL-friendly identifier */
  slug?: string;
  /** Human-readable title */
  title?: string;
  /** Current phase of the tournament */
  phase: TournamentPhase;
  /** Current round number */
  currentRound: number;
  /** Total number of rounds */
  totalRounds: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** ID of winning model if complete */
  winner?: string;
  /** Number of models in tournament */
  bracketSize: number;
  /** All tournament matches */
  matches: BracketMatch[];
  /** Model execution results */
  modelResponses?: Record<string, ModelResponse>;
  /** Challenge prompt for models */
  prompt?: string;
  /** Prompt used for judging */
  judgePrompt?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** ID of creator */
  createdBy?: string;
  /** Display name of creator */
  authorName?: string;
  /** ID of creator for linking */
  authorId?: string;
  /** Number of upvotes */
  upvoteCount?: number;
  /** Whether requesting user has upvoted */
  hasUpvoted?: boolean;
  /** ID of parent tournament if forked */
  parentId?: string | null;
  /** Number of forks */
  forkCount?: number;
  /** Metadata tags */
  tags?: string[];
  /** Participating model IDs */
  models?: string[];
  /** ID of judging model */
  judgeModel?: string;
  /** Hierarchical tagging system */
  tagIds?: HierarchicalTagId[];
}

/**
 * Input for creating a new tournament.
 * @interface
 * @description The input parameters required to create a new tournament.
 * The models array must contain 4, 8, or 16 unique model IDs, and a judge
 * model must be specified to evaluate the matches.
 * @example
 * ```ts
 * const input: CreateTournamentInput = {
 *   prompt: "Explain quantum computing to a 5-year-old",
 *   models: ['gpt-4', 'claude-2', 'palm-2', 'llama-2'],
 *   bracketSize: 4,
 *   judgeModel: 'gpt-4',
 *   title: "Quantum Computing Challenge",
 *   judgePrompt: "Compare the responses and select the better explanation..."
 * };
 * ```
 */
export interface CreateTournamentInput {
  /** Challenge prompt for models to respond to */
  prompt: string;
  /** Array of model IDs to compete */
  models: string[];
  /** Number of models in the tournament (4, 8, or 16) */
  bracketSize: 4 | 8 | 16;
  /** ID of the model that will judge matches */
  judgeModel: string;
  /** Optional human-readable title */
  title?: string;
  /** Optional prompt for the judge model */
  judgePrompt?: string;
  /** Optional legacy metadata tags */
  tags?: string[];
  /** Optional hierarchical tag IDs from taxonomy */
  tagIds?: import("./taxonomy").HierarchicalTagId[];
}

/**
 * Result of validating a judge prompt.
 * @interface
 * @description Contains validation results for a judge prompt, including
 * whether it is valid and any validation errors.
 * @example
 * ```ts
 * const result: JudgePromptValidationResult = {
 *   isValid: false,
 *   errors: ["Judge prompt must be at least 20 characters long"]
 * };
 * ```
 */
export interface JudgePromptValidationResult {
  /** Whether the prompt is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
}

/**
 * Result of validating a challenge prompt.
 * @interface
 * @description Contains validation results for a challenge prompt, including
 * whether it is valid and any validation errors.
 * @example
 * ```ts
 * const result: PromptValidationResult = {
 *   isValid: false,
 *   errors: ["Prompt must be at least 10 characters long"]
 * };
 * ```
 */
export interface PromptValidationResult {
  /** Whether the prompt is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
}

/**
 * Payload data for tournament status API responses
 * @interface
 * @description Complete tournament status data used in API responses
 * with metadata about the tournament's progress and state
 */
export interface TournamentStatusPayload {
  /** Tournament ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Current status */
  status: string;
  /** Number of completed turns */
  turnsComplete: number;
  /** Total turns in tournament */
  totalTurns: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Model responses keyed by model ID */
  modelResponses?: Record<string, { model: string; response: string } | null> | undefined;
  /** Winner model ID if completed */
  winner?: string | undefined;
  /** Response content if available */
  response?: string | undefined;
  /** Selected model if available */
  model?: string | undefined;
  /** Bracket data */
  bracketData?: Record<string, unknown> | undefined;
  /** Error message if any */
  error?: string | undefined;
  /** Current phase of the tournament */
  phase?: TournamentPhase | undefined;
  /** Current round number */
  currentRound?: number | undefined;
  /** Total number of rounds */
  totalRounds?: number | undefined;
  /** Bracket size (number of models) */
  bracketSize?: number | undefined;
  /** Tournament matches */
  matches?: BracketMatch[] | undefined;
  /** Tournament prompt */
  prompt?: string | undefined;
  /** Judge prompt */
  judgePrompt?: string | undefined;
  /** Participating models */
  models?: string[] | undefined;
  /** Judge model ID */
  judgeModel?: string | undefined;
  /** Creation timestamp */
  createdAt?: string | Date | undefined;
  /** Creator user ID */
  createdBy?: string | undefined;
  /** Tournament tags */
  tags?: string[] | undefined;
}

/**
 * Strongly typed tournament status to avoid TypeScript errors with exactOptionalPropertyTypes
 * @interface
 * @description A safe wrapper for tournament status data with defined undefined types
 * instead of optional properties to work with exactOptionalPropertyTypes: true
 */
export interface SafeTournamentStatus {
  /** Whether the operation was successful */
  success: boolean;
  /** Tournament data if available */
  tournament: TournamentStatusResponse["tournament"] | null;
  /** Error message if unsuccessful */
  error: string | undefined;
}

/**
 * Tournament list item for dashboard
 */
export interface TournamentListItem {
  id: string;
  slug: string;
  title: string;
  phase: TournamentPhase;
  progress: number;
  winner?: string;
  createdAt: string;
  createdBy: string;
  authorName?: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  forkCount: number;
  tagIds?: HierarchicalTagId[];
  tags?: string[];
}

/**
 * Tournament fork/version request
 */
export interface TournamentForkRequest {
  tournamentId: string;
  changes?: Partial<CreateTournamentInput>;
}

/**
 * Tournament genealogy node for version tracking
 */
export interface TournamentGenealogyNode {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  parentId?: string;
  children: TournamentGenealogyNode[];
  version: number;
  forkCount: number;
}
