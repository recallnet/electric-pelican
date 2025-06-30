"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UseModelSearchOptions, UseModelSearchResult } from "@/types/hooks";
import { ModelsResponse, ProcessedModel } from "@/types/models";

/**
 * Custom hook for model search functionality.
 * Handles debouncing, API calls, loading states, and result management.
 */
export function useModelSearch({
  initialModels = [],
  debounceMs = 500,
  limit = 100,
  capability = "all",
}: UseModelSearchOptions = {}): UseModelSearchResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProcessedModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Track the current search request to avoid race conditions
  const currentSearchRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(
    async (query: string) => {
      // Cancel any existing search
      if (currentSearchRef.current) {
        currentSearchRef.current.abort();
      }

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If query is empty, clear results immediately
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      // Set up new search with debouncing
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSearching(true);
          setSearchError(null);

          // Create abort controller for this request
          const abortController = new AbortController();
          currentSearchRef.current = abortController;

          // Build search URL with query parameters
          const searchParams = new URLSearchParams({
            q: query.trim(),
            limit: limit.toString(),
            capability,
          });

          const response = await fetch(`/api/models?${searchParams.toString()}`, {
            signal: abortController.signal,
            cache: "no-cache",
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }

          const data: ModelsResponse = await response.json();

          // Only update if this request wasn't aborted
          if (!abortController.signal.aborted) {
            setSearchResults(data.models);
            currentSearchRef.current = null;
          }
        } catch (error) {
          // Ignore abort errors (they're expected when canceling requests)
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          console.error("[useModelSearch] API call failed:", error);
          const message = error instanceof Error ? error.message : "Search failed";
          setSearchError(message);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);
    },
    [debounceMs, limit, capability],
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    performSearch(searchQuery);

    // Cleanup function
    return () => {
      if (currentSearchRef.current) {
        currentSearchRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);

    // Cancel any ongoing search
    if (currentSearchRef.current) {
      currentSearchRef.current.abort();
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Determine which models to show
  const isShowingSearchResults = searchQuery.trim().length > 0;
  const models = isShowingSearchResults ? searchResults : initialModels;

  return {
    searchQuery,
    models,
    isSearching,
    isShowingSearchResults,
    searchError,
    setSearchQuery,
    clearSearch,
  };
}
