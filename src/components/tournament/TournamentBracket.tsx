"use client";

import React, { useMemo } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type RoundData, type TournamentBracketProps } from "@/types/components";

import { MatchResult } from "./MatchResult";

/**
 * TournamentBracket component displays the tournament bracket
 * with Electric Pelican design system styling.
 */
export function TournamentBracket({
  matches,
  currentRound,
  totalRounds,
  bracketSize,
  modelNames = {},
  modelResponses = {},
  className = "",
}: TournamentBracketProps) {
  // Organize matches by rounds
  const roundsData = useMemo((): RoundData[] => {
    const rounds: RoundData[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches
        .filter((m) => m.round === round)
        .sort((a, b) => a.position - b.position);

      rounds.push({
        round,
        matches: roundMatches,
        isActive: round === currentRound,
      });
    }

    return rounds;
  }, [matches, totalRounds, currentRound]);

  return (
    <div className={`tournament-bracket ${className}`}>
      {/* Bracket Header */}
      <div className="mb-4 text-center">
        <h2 className="text-lg text-brand-black mb-1">Tournament Bracket</h2>
        <div className="text-xs text-brand-gray-03">
          {bracketSize} Models • {totalRounds} Rounds
        </div>
      </div>

      {/* Bracket Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max p-3">
          {roundsData.map((roundData, roundIndex) => (
            <div key={roundData.round} className="flex flex-col min-w-[220px]">
              {/* Round Header */}
              <div className="mb-3 text-center">
                <GlassPanel className="p-2">
                  <h3
                    className={`text-xs font-semibold ${
                      roundData.isActive ? "text-brand-green" : "text-brand-gray-03"
                    }`}
                  >
                    {roundData.round === totalRounds ? "FINAL" : `ROUND ${roundData.round}`}
                  </h3>
                  {roundData.isActive && (
                    <div className="text-xs text-brand-green mt-1">• CURRENT •</div>
                  )}
                </GlassPanel>
              </div>

              {/* Round Matches */}
              <div className="flex flex-col gap-4 flex-1">
                {roundData.matches.map((match) => (
                  <div key={match.id} className="relative">
                    <MatchResult
                      match={match}
                      modelNames={modelNames}
                      modelResponses={modelResponses}
                      isCurrentRound={roundData.isActive}
                    />

                    {/* Connection Line to Next Round */}
                    {roundIndex < roundsData.length - 1 && (
                      <div
                        className="absolute left-full top-1/2 w-6 h-0.5 bg-brand-gray-02 -translate-y-0.5 z-10"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Scroll Hint */}
      <div className="mt-3 text-center text-xs text-brand-gray-03 md:hidden">
        ← Scroll to view full bracket →
      </div>

      {/* Bracket Legend */}
      <GlassPanel className="mt-4 p-3">
        <h4 className="text-xs font-semibold text-brand-gray-03 mb-2">Match Status</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-green/20 border border-brand-green rounded" />
            <span className="text-xs text-brand-green">Complete</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-yellow/20 border border-brand-yellow rounded" />
            <span className="text-xs text-brand-yellow">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-brand-gray-02 border border-brand-gray-03 rounded" />
            <span className="text-xs text-brand-gray-03">Waiting</span>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
