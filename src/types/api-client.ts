/**
 * Type definitions for API client and related hooks
 */

/**
 * Parameters for API client configuration
 */
export interface ApiClientParams {
  /** Base URL for API requests */
  baseUrl?: string;
  /** Default headers for API requests */
  headers?: Record<string, string>;
  /** Whether to include credentials in requests */
  credentials?: RequestCredentials;
  /** Cache configuration */
  cache?: RequestCache;
}

/**
 * Options for typed API calls
 */
export type TypedApiOptions = Pick<ApiClientParams, "headers" | "cache"> & {
  /** Optional abort signal for cancelling request */
  signal?: AbortSignal;
};

/**
 * Model search parameters
 */
export interface ModelSearchParams {
  /** Text query for search */
  query?: string;
  /** Sort field */
  sort?: string;
  /** Sort direction */
  order?: "asc" | "desc";
  /** Number of results per page */
  limit?: number;
  /** Page number */
  page?: number;
}

/**
 * Model search hook state
 */
export interface ModelSearchState {
  /** List of models */
  models: Record<string, unknown>[];
  /** Total result count */
  total: number;
  /** Current page */
  page: number;
  /** Whether search is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Tournament list parameters
 */
export interface TournamentListParams {
  /** Sort field */
  sort?: string;
  /** Sort direction */
  order?: "asc" | "desc";
  /** Number of results per page */
  limit?: number;
  /** Page number */
  page?: number;
}

/**
 * Tournament list hook state
 */
export interface TournamentListState {
  /** List of tournaments */
  tournaments: Record<string, unknown>[];
  /** Total result count */
  total: number;
  /** Current page */
  page: number;
  /** Whether query is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Tournament progress state
 */
export interface TournamentProgressState {
  /** Tournament data */
  tournament: Record<string, unknown> | null;
  /** Current bracket */
  bracket: Record<string, unknown> | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether to poll for updates */
  shouldPoll: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook-specific tournament progress state
 * @description Extends the base API state with additional fields needed by the useTournamentProgress hook
 */
export interface HookTournamentProgressState {
  /** Tournament data */
  tournament: import("@/types/tournament").TournamentStatusResponse["tournament"] | null;
  /** Current bracket */
  bracket: Record<string, unknown> | null;
  /** Whether the data is currently loading */
  loading: boolean;
  /** Whether active polling is in progress */
  isPolling: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * User list data from API
 */
export interface UserListData {
  /** List of user profiles */
  users: Array<{
    /** User ID */
    id: string;
    /** User name */
    name: string;
    /** User display name */
    displayName: string;
    /** User email address */
    email?: string;
    /** User avatar URL */
    avatarUrl?: string;
    /** Number of evaluations created by user */
    evaluationsCreated: number;
    /** User creation timestamp */
    createdAt: string;
  }>;
}
