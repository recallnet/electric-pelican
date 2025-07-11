import type { ModelSearchParams } from "./api-client";
import type { TournamentSummary } from "./app";
import type { ProcessedModel } from "./models";

/**
 * Options for the useModelSearch hook
 */
export interface UseModelSearchOptions extends Pick<ModelSearchParams, "limit"> {
  /** Initial models to show when no search is active */
  initialModels?: ProcessedModel[];
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Capability filter */
  capability?: "text" | "images" | "all";
}

/**
 * Result from the useModelSearch hook
 */
export interface UseModelSearchResult {
  /** Current search query */
  searchQuery: string;
  /** Models to display (either search results or initial models) */
  models: ProcessedModel[];
  /** Whether a search API call is in progress */
  isSearching: boolean;
  /** Whether this is showing search results (vs initial models) */
  isShowingSearchResults: boolean;
  /** Error message if search failed */
  searchError: string | null;
  /** Function to update search query */
  setSearchQuery: (query: string) => void;
  /** Function to clear search and return to initial models */
  clearSearch: () => void;
}

/**
 * Response type for tournament list endpoints
 */
export interface TournamentListResponse {
  /** List of tournaments */
  tournaments: TournamentSummary[];
  /** Total result count */
  total: number;
  /** Current page */
  page: number;
  /** Whether there are more pages of results */
  hasMore: boolean;
}

/**
 * Return type for useTournamentList hook
 */
export interface UseTournamentListReturn {
  /** List of tournaments */
  tournaments: TournamentSummary[];
  /** Total result count */
  total: number;
  /** Current page */
  page: number;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether there are more pages of tournaments to fetch */
  hasMore: boolean;
  /** Function to manually refetch the tournament list */
  refetch: () => void;
}

/**
 * Props for the useModelSelection hook
 */
export interface UseModelSelectionProps {
  /** Optional default bracket size */
  defaultBracketSize?: 4 | 8 | 16;
  /** Default contestant model IDs to pre-select */
  defaultContestants?: string[];
  /** Default judge model ID to pre-select */
  defaultJudge?: string;
}

/**
 * Return type for the useModelSelection hook
 */
export interface UseModelSelectionReturn {
  // State
  models: ProcessedModel[];
  loading: boolean;
  error: string | null;
  bracketSize: 4 | 8 | 16;
  selectedContestants: string[];
  selectedJudge: string | null;

  // Actions
  handleBracketSizeChange: (newSize: 4 | 8 | 16) => void;
  handleToggleContestant: (modelId: string) => void;
  handleSelectJudge: (modelId: string) => void;
  handleRemoveContestant: (modelId: string) => void;
  handleRemoveJudge: () => void;

  // Computed
  isSelectionComplete: boolean;
}
