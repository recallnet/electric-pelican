import { useEffect, useRef, useState } from "react";

import type { HookTournamentProgressState } from "@/types/api-client";

/**
 * Hook for fetching tournament progress with automatic polling for active tournaments.
 * Polls every 3 seconds for tournaments that are still running.
 */
export function useTournamentProgress(tournamentId: string | null) {
  const [state, setState] = useState<HookTournamentProgressState>({
    tournament: null,
    bracket: null,
    loading: !!tournamentId, // Only start loading if we have an ID
    error: null,
    isPolling: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const failureCount = useRef(0);
  const MAX_FAILURES = 5;
  const BASE_POLL_INTERVAL = 3000;

  useEffect(() => {
    if (!tournamentId) {
      setState({ tournament: null, bracket: null, loading: false, error: null, isPolling: false });
      return;
    }

    let isCancelled = false;

    const fetchTournament = async () => {
      try {
        console.log(`[useTournamentProgress] Fetching tournament: ${tournamentId}`);

        const { typedApi } = await import("@/lib/api-client");
        const data = await typedApi("GET /api/tournament/:id/status", { id: tournamentId });

        if (isCancelled) {
          console.log(`[useTournamentProgress] Request cancelled for: ${tournamentId}`);
          return;
        }

        console.log(`[useTournamentProgress] Success:`, data.success, data.tournament?.phase);

        if (data.success && data.tournament) {
          failureCount.current = 0;
          setState((prev) => ({
            ...prev,
            tournament: data.tournament,
            bracket: null,
            loading: false,
            error: null,
          }));

          // Start or stop polling based on tournament status
          const isActive =
            data.tournament.phase !== "completed" && data.tournament.phase !== "failed";

          if (isActive && !intervalRef.current) {
            // Start polling for active tournaments
            console.log(`[useTournamentProgress] Starting polling for active tournament`);
            setState((prev) => ({ ...prev, isPolling: true }));
            intervalRef.current = setInterval(() => {
              if (!isCancelled) {
                fetchTournament();
              }
            }, BASE_POLL_INTERVAL);
          } else if (!isActive && intervalRef.current) {
            // Stop polling for completed tournaments
            console.log(`[useTournamentProgress] Stopping polling for completed tournament`);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setState((prev) => ({ ...prev, isPolling: false }));
          }
        } else {
          failureCount.current++;
          setState((prev) => ({
            ...prev,
            tournament: null,
            bracket: null,
            loading: false,
            error: data.error || "Failed to load tournament",
          }));
          if (failureCount.current >= MAX_FAILURES && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setState((prev) => ({ ...prev, isPolling: false }));
          }
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        failureCount.current++;
        console.error(`[useTournamentProgress] Error:`, err);
        setState((prev) => ({
          ...prev,
          tournament: null,
          bracket: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load tournament",
        }));
        if (failureCount.current >= MAX_FAILURES && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setState((prev) => ({ ...prev, isPolling: false }));
        }
      }
    };

    // Initial fetch
    fetchTournament();

    return () => {
      isCancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tournamentId]);

  const refresh = () => {
    if (!tournamentId) return;
    failureCount.current = 0;

    console.log(`[useTournamentProgress] Manual refresh: ${tournamentId}`);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Trigger re-fetch by forcing effect to re-run
    // We'll do this by directly calling the fetch function
    const fetchTournament = async () => {
      try {
        const { typedApi } = await import("@/lib/api-client");
        const data = await typedApi("GET /api/tournament/:id/status", { id: tournamentId });

        if (data.success && data.tournament) {
          setState((prev) => ({
            ...prev,
            tournament: data.tournament,
            bracket: null,
            loading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            tournament: null,
            bracket: null,
            loading: false,
            error: data.error || "Failed to load tournament",
          }));
        }
      } catch (err: unknown) {
        console.error("Tournament refresh error:", err);
        setState((prev) => ({
          ...prev,
          tournament: null,
          bracket: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load tournament",
        }));
      }
    };

    fetchTournament();
  };

  return {
    tournament: state.tournament,
    bracket: state.bracket,
    loading: state.loading,
    error: state.error,
    isPolling: state.isPolling,
    refresh,
  };
}
