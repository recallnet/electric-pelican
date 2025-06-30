/**
 * @file Custom hook for tournament data management.
 * @description Handles tournament data loading, polling, and state management.
 */

import { useEffect, useState } from "react";

import { typedApi } from "@/lib/api-client";
import { SafeTournamentStatus, TournamentStatusResponse } from "@/types/tournament";

/**
 * Custom hook for managing tournament data and state.
 * @param tournamentId - Tournament ID to load data for
 * @returns Tournament data and state management object
 */
export function useTournamentData(tournamentId: string) {
  // Tournament state
  const [tournamentStatus, setTournamentStatus] = useState<SafeTournamentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upvote state - initialized from API data
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [upvoteCount, setUpvoteCount] = useState<number>(0);

  /**
   * Load tournament data using typed API.
   */
  const loadTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both tournament status and complete tournament data using typedApi
      const [statusData, resultsData] = await Promise.all([
        typedApi("GET /api/tournament/:id/status", { id: tournamentId }),
        typedApi("GET /api/tournament/:id/results", { id: tournamentId }),
      ]);

      if (!statusData.success || !statusData.tournament) {
        throw new Error(statusData.error || "Tournament not found");
      }

      // Get complete tournament metadata from results
      const tournamentMetadata = resultsData.success ? resultsData.data.tournament : null;

      if (!tournamentMetadata) {
        // If we don't have metadata, just use status data directly and set not loading
        // Make a type-safe copy of the status data that matches our state type
        const safeStatusData: SafeTournamentStatus = {
          success: statusData.success,
          tournament: statusData.tournament ? { ...statusData.tournament } : null,
          error: statusData.error || undefined, // Ensure null becomes undefined, not a string
        };
        setTournamentStatus(safeStatusData);
        setLoading(false);
        return;
      }

      // Create a new status tournament object that we're sure has all required properties
      // This avoids TypeScript errors with optional properties
      const statusTournament = statusData.tournament;

      // Create a properly typed tournament object that meets TypeScript requirements
      // We need to ensure we have all required properties and optional properties are correctly typed
      const enrichedTournament = {
        // Required fields with their exact types
        id: statusTournament.id,
        phase: statusTournament.phase,
        currentRound: statusTournament.currentRound,
        totalRounds: statusTournament.totalRounds,
        progress: statusTournament.progress,
        bracketSize: statusTournament.bracketSize,
        matches: statusTournament.matches,

        // Optional fields - prioritize results API metadata for consistent display
        title: tournamentMetadata.title ?? statusTournament.title,
        prompt: tournamentMetadata.prompt ?? statusTournament.prompt,
        judgePrompt: tournamentMetadata.judgePrompt ?? statusTournament.judgePrompt,
        createdAt: tournamentMetadata.createdAt ?? statusTournament.createdAt,

        // IMPORTANT: Author info from metadata API has correct format for display
        authorName: tournamentMetadata.authorName ?? statusTournament.authorName,
        authorId:
          tournamentMetadata.authorId ?? tournamentMetadata.createdBy ?? statusTournament.authorId,
        createdBy: tournamentMetadata.createdBy ?? statusTournament.createdBy,

        // Other tournament metadata
        tagIds: tournamentMetadata.tagIds ?? statusTournament.tagIds,
        upvoteCount: tournamentMetadata.upvoteCount ?? statusTournament.upvoteCount ?? 0,
        hasUpvoted: tournamentMetadata.hasUpvoted === true,
        winner: statusTournament.winner,
        slug: tournamentMetadata.slug ?? statusTournament.slug,
        parentId: tournamentMetadata.parentId ?? statusTournament.parentId,
        forkCount: tournamentMetadata.forkCount ?? statusTournament.forkCount ?? 0,
        modelResponses: statusTournament.modelResponses,
        models: tournamentMetadata.models ?? statusTournament.models,
        judgeModel: tournamentMetadata.judgeModel ?? statusTournament.judgeModel,
      } as TournamentStatusResponse["tournament"];

      // Create a properly typed status response object that matches our state type
      const updatedStatusResponse: SafeTournamentStatus = {
        success: statusData.success,
        tournament: enrichedTournament,
        error: statusData.error || undefined, // Ensure null becomes undefined, not a string
      };

      // Update state with our enriched tournament data
      setTournamentStatus(updatedStatusResponse);
      setLoading(false);

      // Update local upvote state from API
      if (tournamentMetadata?.upvoteCount !== undefined) {
        setUpvoteCount(tournamentMetadata.upvoteCount);
      }
      if (tournamentMetadata?.hasUpvoted !== undefined) {
        setHasUpvoted(tournamentMetadata.hasUpvoted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament");
      setLoading(false);
    }
  };

  // Load tournament data on mount
  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  // Poll for updates during active tournaments with faster polling during judging
  useEffect(() => {
    if (!tournamentStatus?.tournament || tournamentStatus.tournament.phase === "completed") {
      return;
    }

    // Use faster polling during judging phase to catch individual match updates
    const pollFrequency = tournamentStatus.tournament.phase === "judging" ? 1500 : 3000;

    const pollInterval = setInterval(async () => {
      try {
        const response = await typedApi("GET /api/tournament/:id/status", {
          id: tournamentId,
        });

        if (response.success && response.tournament) {
          // Update only the tournament data while preserving metadata
          setTournamentStatus((prev) => {
            if (!prev || !prev.tournament) return prev;

            // Preserve existing metadata but update dynamic tournament state
            const updatedTournament = {
              ...prev.tournament,
              phase: response.tournament!.phase,
              currentRound: response.tournament!.currentRound,
              progress: response.tournament!.progress,
              matches: response.tournament!.matches,
              winner: response.tournament!.winner ?? prev.tournament.winner,
              modelResponses: response.tournament!.modelResponses,
            } as typeof prev.tournament;

            return {
              ...prev,
              tournament: updatedTournament,
            };
          });
        }
      } catch (err) {
        console.error("Failed to poll tournament status:", err);
        // Don't set error state for polling failures to avoid disrupting the UI
      }
    }, pollFrequency);

    return () => clearInterval(pollInterval);
  }, [tournamentId, tournamentStatus?.tournament?.phase]);

  /**
   * Handle upvote action.
   */
  const handleUpvote = async () => {
    try {
      const response = await typedApi("POST /api/tournament/:id/upvote", {
        id: tournamentId,
      });

      if (response.success) {
        setHasUpvoted(response.hasUpvoted);
        setUpvoteCount(response.upvoteCount);
      }
    } catch (err) {
      console.error("Failed to upvote tournament:", err);
    }
  };

  return {
    tournamentStatus,
    loading,
    error,
    hasUpvoted,
    upvoteCount,
    handleUpvote,
    refetch: loadTournamentData,
  };
}
