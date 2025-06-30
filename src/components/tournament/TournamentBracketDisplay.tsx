"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import type { BracketMatch } from "@/types/tournament";

interface TournamentBracketDisplayProps {
  /** Array of tournament matches */
  matches: BracketMatch[];
  /** Total number of rounds */
  totalRounds: number;
  /** Callback when a match is selected */
  onMatchSelect: (match: BracketMatch) => void;
}

/**
 * TournamentBracketDisplay renders the tournament bracket with matches organized by rounds.
 * Shows match status, competitors, and winners with interactive match selection.
 *
 * @param matches - Array of tournament matches
 * @param totalRounds - Total number of rounds
 * @param onMatchSelect - Callback when a match is selected
 */
export function TournamentBracketDisplay({
  matches,
  totalRounds,
  onMatchSelect,
}: TournamentBracketDisplayProps) {
  // Generate round names based on bracket size
  const getRoundName = (round: number) => {
    if (round === totalRounds) return "FINAL";
    if (round === totalRounds - 1) return "SEMIFINALS";
    return `ROUND ${round}`;
  };

  const availableRounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => b - a);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {availableRounds.map((round) => (
        <div key={round} className="relative">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                round === 3
                  ? "bg-gradient-to-r from-brand-green/20 to-brand-blue/20 border-2 border-brand-green/40"
                  : round === 2
                    ? "bg-gradient-to-r from-brand-blue/15 to-brand-purple/15 border border-brand-blue/30"
                    : "bg-gradient-to-r from-brand-gray-01 to-brand-gray-02 border border-brand-gray-03"
              }`}
            >
              <span className="text-lg">{round === 3 ? "🏆" : round === 2 ? "🥊" : "⚡"}</span>
              <h3
                className={`text-sm font-bold ${
                  round === 3
                    ? "text-brand-green"
                    : round === 2
                      ? "text-brand-blue"
                      : "text-brand-black"
                }`}
              >
                {getRoundName(round)}
              </h3>
              <span className="text-xs text-brand-gray-04">
                {matches.filter((m) => m.round === round).length} match
                {matches.filter((m) => m.round === round).length > 1 ? "es" : ""}
              </span>
            </div>
          </div>

          <div
            className={`flex flex-wrap justify-center gap-4 ${
              round === 1
                ? "max-w-5xl mx-auto"
                : round === 2
                  ? "max-w-3xl mx-auto"
                  : "max-w-md mx-auto"
            }`}
          >
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.position - b.position)
              .map((match) => (
                <GlassPanel
                  key={match.id}
                  className="p-3 cursor-pointer hover:shadow-lg transition-all duration-200 w-full max-w-xs flex-shrink-0"
                  onClick={() => onMatchSelect(match)}
                >
                  <div className="space-y-2">
                    <div
                      className={`text-center p-2 rounded-lg ${
                        match.winner === match.modelA
                          ? "bg-brand-green/10 border border-brand-green/20"
                          : "bg-brand-gray-01"
                      }`}
                    >
                      <div className="text-xs text-brand-black font-medium">
                        {match.winner === match.modelA ? "🏆 " : ""}
                        {match.modelA}
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-xs text-brand-gray-03 bg-brand-white px-2 py-1 rounded-full border">
                        VS
                      </span>
                    </div>

                    <div
                      className={`text-center p-2 rounded-lg ${
                        match.winner === match.modelB
                          ? "bg-brand-green/10 border border-brand-green/20"
                          : "bg-brand-gray-01"
                      }`}
                    >
                      <div className="text-xs text-brand-black font-medium">
                        {match.winner === match.modelB ? "🏆 " : ""}
                        {match.modelB}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-2 pt-2 border-t border-brand-gray-02">
                    <span
                      className={`text-xs ${
                        match.winner ? "text-brand-green" : "text-brand-gray-04"
                      }`}
                    >
                      {match.winner ? "✓ Complete" : "⏳ Pending"}
                    </span>
                  </div>
                </GlassPanel>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
