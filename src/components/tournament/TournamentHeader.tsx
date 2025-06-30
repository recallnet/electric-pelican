"use client";

import Link from "next/link";
import { useState } from "react";

import { ClickableTagsDisplay } from "@/components/ui/clickable-tag";
import type { Tournament } from "@/types/tournament";

import { ChampionResponseRenderer } from "./ChampionResponseRenderer";

interface TournamentHeaderProps {
  /** Tournament data */
  tournament: Tournament;
  /** Whether user has upvoted */
  hasUpvoted: boolean;
  /** Current upvote count */
  upvoteCount: number;
  /** Copy success state */
  copySuccess: boolean;
  /** Callback for upvote action */
  onUpvote: () => void;
  /** Callback for share action */
  onShare: () => void;
}

/**
 * TournamentHeader displays the tournament title, status, progress, and winner celebration.
 * Includes upvote/share actions and winner response display.
 *
 * @param tournament - Tournament data
 * @param hasUpvoted - Whether user has upvoted
 * @param upvoteCount - Current upvote count
 * @param copySuccess - Copy success state
 * @param onUpvote - Callback for upvote action
 * @param onShare - Callback for share action
 */
export function TournamentHeader({
  tournament,
  hasUpvoted,
  upvoteCount,
  copySuccess,
  onUpvote,
  onShare,
}: TournamentHeaderProps) {
  const [showWinningResponse, setShowWinningResponse] = useState(false);

  // Tournament data destructuring
  const { bracketSize, totalRounds, winner } = tournament;
  const isInProgress = tournament.phase !== "completed" && tournament.phase !== "failed";
  const tournamentComplete = tournament.phase === "completed";
  const winningResponse = winner ? tournament.modelResponses?.[winner]?.response : null;

  // Tournament metadata
  const tournamentTitle = tournament.title ?? "Tournament";
  const tournamentCreatedAt = tournament?.createdAt
    ? new Date(tournament.createdAt).toLocaleDateString()
    : "Unknown date";
  const challengePrompt = tournament.prompt ?? "";
  const judgingPrompt = tournament.judgePrompt ?? "";

  // Use hierarchical tag IDs directly for proper URL generation
  const tournamentTags = (() => {
    if (tournament?.tagIds && Array.isArray(tournament.tagIds) && tournament.tagIds.length > 0) {
      return tournament.tagIds; // Pass the actual tag IDs, not the names
    }
    return ["evaluation"]; // Default fallback
  })();

  // Get champion from completed tournament
  const champion = tournamentComplete && winner ? winner : null;

  // Get phase display info
  const getPhaseInfo = () => {
    switch (tournament.phase) {
      case "setup":
        return { status: "Setting up tournament...", color: "text-brand-gray-04" };
      case "executing_models":
        return {
          status: `Running models... (${tournament.progress}% complete)`,
          color: "text-brand-blue",
        };
      case "judging":
        return {
          status: `Judging matches... (Round ${tournament.currentRound}/${totalRounds})`,
          color: "text-brand-purple",
        };
      case "completed":
        return { status: "Tournament Complete!", color: "text-brand-green" };
      case "failed":
        return { status: "Tournament Failed", color: "text-red-600" };
      default:
        return { status: "Unknown status", color: "text-brand-gray-04" };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-brand-black mb-1">{tournamentTitle}</h1>
      <p className="text-sm text-brand-gray-04 mb-1">{bracketSize}-Model AI Championship</p>

      {/* Tournament Status */}
      <div className={`text-base font-semibold mb-3 ${phaseInfo.color}`}>{phaseInfo.status}</div>

      {/* Progress Bar */}
      {isInProgress && (
        <div className="max-w-md mx-auto mb-4">
          <div className="bg-brand-gray-01 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-blue h-full transition-all duration-500 ease-out"
              style={{ width: `${tournament.progress}%` }}
            />
          </div>
          <p className="text-xs text-brand-gray-04 mt-1">{tournament.progress}% complete</p>
        </div>
      )}

      {/* Creator & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        <div className="text-xs text-brand-gray-04">
          Created by{" "}
          {tournament?.authorId ? (
            <Link href={`/user/${tournament.authorId}`} className="font-medium hover:underline">
              {tournament.authorName || "Anonymous"}
            </Link>
          ) : (
            <span className="font-medium">{tournament?.authorName || "Anonymous"}</span>
          )}{" "}
          • {tournamentCreatedAt}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUpvote}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              hasUpvoted
                ? "bg-brand-blue text-brand-white"
                : "bg-brand-gray-01 text-brand-gray-04 hover:bg-brand-gray-02"
            }`}
          >
            <span>🚀</span>
            <span className={hasUpvoted ? "text-brand-white font-medium" : ""}>{upvoteCount}</span>
          </button>
          <button
            onClick={onShare}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-200 min-w-[60px] justify-center ${
              copySuccess
                ? "bg-brand-green text-brand-white scale-105"
                : "bg-brand-gray-01 text-brand-gray-04 hover:bg-brand-gray-02"
            }`}
          >
            <span>{copySuccess ? "✓" : "🔗"}</span>
            <span>{copySuccess ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Winner Celebration */}
      {tournamentComplete && champion && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200/30 rounded-lg shadow-e1">
          <div className="text-3xl mb-2">🏆</div>
          <h2 className="text-lg font-bold text-green-700 mb-1">Tournament Champion!</h2>
          <Link
            href={`/models/${champion}`}
            className="text-base text-green-600 font-semibold hover:text-green-500 transition-colors hover:underline"
          >
            {champion}
          </Link>

          <div className="flex flex-wrap gap-1 justify-center mt-3">
            <ClickableTagsDisplay tags={tournamentTags} />
          </div>

          {winningResponse && (
            <div className="mt-4">
              <button
                onClick={() => setShowWinningResponse(!showWinningResponse)}
                className="flex items-center gap-2 mx-auto px-3 py-1 bg-brand-green/20 text-brand-green hover:bg-brand-green/30 rounded-lg text-xs font-medium transition-colors"
              >
                <span>View Winning Response</span>
                <div className={`transition-transform ${showWinningResponse ? "rotate-180" : ""}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {showWinningResponse && (
                <>
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-brand-green/20">
                    <div className="text-xs text-brand-gray-04 mb-2">Challenge Prompt:</div>
                    <p className="text-xs text-brand-gray-04 mb-1">{challengePrompt}</p>
                  </div>
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-brand-green/20">
                    <div className="text-xs text-brand-gray-04 mb-2">Judging Criteria:</div>
                    <p className="text-xs text-brand-gray-04 mb-1">{judgingPrompt}</p>
                  </div>
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-brand-green/20">
                    <div className="text-xs text-brand-gray-04 mb-2">Champion&apos;s Response:</div>
                    <ChampionResponseRenderer
                      content={winningResponse}
                      className="text-xs text-brand-black leading-relaxed"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
