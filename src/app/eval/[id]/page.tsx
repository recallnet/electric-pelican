"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { MatchDetailsModal } from "@/components/tournament/MatchDetailsModal";
import { TournamentBracketDisplay } from "@/components/tournament/TournamentBracketDisplay";
import { TournamentHeader } from "@/components/tournament/TournamentHeader";
import { useTournamentData } from "@/hooks/useTournamentData";
import type { BracketMatch } from "@/types/tournament";

export default function TournamentPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = typeof params?.id === "string" ? params.id : "";

  // Use custom hook for tournament data management
  const { tournamentStatus, loading, error, hasUpvoted, upvoteCount, handleUpvote } =
    useTournamentData(tournamentId);

  // UI state
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle share button
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-2"></div>
          <p className="text-brand-gray-04">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-xl font-bold text-red-600 mb-2">Tournament Not Found</h1>
          <p className="text-brand-gray-04 mb-4">{error}</p>
          <Link href="/dashboard" className="text-brand-blue hover:text-brand-blue/80 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tournament = tournamentStatus?.tournament;
  if (!tournament) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <p className="text-brand-gray-04">No tournament data available</p>
      </div>
    );
  }

  // Tournament data destructuring
  const { matches, totalRounds } = tournament;

  return (
    <div className="min-h-screen bg-brand-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Tournament Header */}
        <TournamentHeader
          tournament={tournament}
          hasUpvoted={hasUpvoted}
          upvoteCount={upvoteCount}
          copySuccess={copySuccess}
          onUpvote={handleUpvote}
          onShare={handleShare}
        />

        {/* Tournament Bracket */}
        <TournamentBracketDisplay
          matches={matches}
          totalRounds={totalRounds}
          onMatchSelect={setSelectedMatch}
        />

        {/* Match Details Modal */}
        <MatchDetailsModal
          selectedMatch={selectedMatch}
          tournament={tournament}
          onClose={() => setSelectedMatch(null)}
        />
      </div>
    </div>
  );
}
