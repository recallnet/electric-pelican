/**
 * @file useTournamentList Hook
 * Custom hook for fetching tournament list data with proper error handling and loading states
 */

import { useEffect, useState } from "react";

import { type TournamentListResponse, type TournamentSummary } from "@/types/app";
import type { UseTournamentListReturn } from "@/types/hooks";

/**
 * Custom hook to fetch tournament list data
 */
export function useTournamentList(page: number = 1): UseTournamentListReturn {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tournament/list?page=${page}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch tournaments: ${response.status}`);
        }

        const data: TournamentListResponse = await response.json();
        setTournaments(data.tournaments);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tournaments");
        setTournaments([]);
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [page]);

  return {
    tournaments,
    loading,
    error,
    total,
    page,
    hasMore,
    refetch: () => {
      // Implementation of refetch function
    },
  };
}
