/**
 * API-specific types and interfaces
 */

import { type ModelResponse, type Tournament } from "./tournament";

/** Base API response interface */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

/** Tournament list response */
export interface TournamentListResponse {
  tournaments: Tournament[];
  total: number;
  page: number;
  hasMore: boolean;
}

/** Model execution response */
export interface ModelExecutionResponse {
  modelId: string;
  response: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Tournament status response */
export interface TournamentStatusResponse {
  tournament: Tournament;
  modelResponses: Record<string, ModelResponse>;
  currentRound: number;
  progress: number;
  error?: string;
}

/** Tournament creation request */
export interface TournamentCreateRequest {
  prompt: string;
  judgePrompt: string;
  models: string[];
  judgeModel: string;
}

/** Tournament fork request */
export interface TournamentForkRequest {
  tournamentId: string;
  changes?: Partial<TournamentCreateRequest>;
}

/** API error response */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/** API client options */
export interface TypedApiOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Fork tournament request */
export interface ForkRequest {
  userId: string;
  title?: string;
}

/** OpenRouter API types */
export interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
  created: number;
}

/** Version request for tournament versioning */
export interface VersionRequest {
  userId: string;
}
