"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type RecentMatchesProps } from "@/types/components";

/**
 * Recent matches section showing the model's latest matches and their outcomes.
 * Displays ELO changes, opponents, and match details.
 */
export function RecentMatches({ modelStats }: RecentMatchesProps) {
  const { modelScore, recentMatches } = modelStats;

  // Format model name for display
  const formatModelName = (modelId: string): string => {
    const parts = modelId.split("/");
    const modelName = parts[parts.length - 1] || modelId;

    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate ELO change statistics

  // Get match data for this model
  const getMatchInfo = (match: (typeof recentMatches)[0]) => {
    const isWinner = match.winnerModelId === modelScore.modelId;
    const opponent = isWinner ? match.loserModelId : match.winnerModelId;
    const scoreBefore = isWinner ? match.winnerScoreBefore : match.loserScoreBefore;
    const scoreAfter = isWinner ? match.winnerScoreAfter : match.loserScoreAfter;
    const scoreChange = scoreAfter - scoreBefore;

    return {
      isWinner,
      opponent,
      scoreBefore,
      scoreAfter,
      scoreChange,
      result: isWinner ? "win" : "loss",
    };
  };

  if (recentMatches.length === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-headline text-brand-black mb-4">Recent Matches</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-gray-01 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-gray-03"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-body text-brand-gray-04 mb-2">No recent matches</p>
          <p className="text-label text-brand-gray-03">
            Match history will appear after participating in evaluations
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-headline text-brand-black">Recent Matches</h2>
        <div className="text-label text-brand-gray-03">Last {recentMatches.length} matches</div>
      </div>

      <div className="space-y-4">
        {recentMatches.map((match, index) => {
          const matchInfo = getMatchInfo(match);

          return (
            <div
              key={`${match.tournamentRunId}-${match.roundNumber}-${index}`}
              className="p-4 bg-brand-gray-01/20 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Match Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Result Badge */}
                    <span
                      className={`px-2 py-1 rounded-md text-label font-semibold ${
                        matchInfo.isWinner ? "bg-brand-green text-white" : "bg-brand-red text-white"
                      }`}
                    >
                      {matchInfo.isWinner ? "Won" : "Lost"}
                    </span>

                    {/* Opponent */}
                    <div className="flex items-center gap-2">
                      <span className="text-body text-brand-gray-04">vs</span>
                      <span className="text-body font-medium text-brand-black">
                        {formatModelName(matchInfo.opponent)}
                      </span>
                    </div>
                  </div>

                  {/* Match Details */}
                  <div className="flex flex-wrap items-center gap-4 text-label text-brand-gray-03">
                    <span>{formatDate(match.createdAt)}</span>
                    <span>Round {match.roundNumber}</span>
                    <span className="truncate max-w-32">ID: {match.tournamentRunId.slice(-8)}</span>
                  </div>
                </div>

                {/* Score Change */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-body text-brand-gray-04">
                      {matchInfo.scoreBefore.toLocaleString()}
                    </span>
                    <span className="text-brand-gray-03">→</span>
                    <span className="text-body font-semibold text-brand-black">
                      {matchInfo.scoreAfter.toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`text-body font-semibold ${
                      matchInfo.scoreChange > 0 ? "text-brand-green" : "text-brand-red"
                    }`}
                  >
                    {matchInfo.scoreChange > 0 ? "+" : ""}
                    {matchInfo.scoreChange}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Match Statistics */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {/* Recent Win Rate */}
          <div>
            <div className="text-body font-semibold text-brand-blue">
              {recentMatches.length > 0
                ? (
                    (recentMatches.filter((match) => match.winnerModelId === modelScore.modelId)
                      .length /
                      recentMatches.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-label text-brand-gray-03 uppercase">Recent Win Rate</div>
          </div>

          {/* Average Change */}
          <div>
            {(() => {
              const changes = recentMatches.map((match) => {
                const matchInfo = getMatchInfo(match);
                return matchInfo.scoreChange;
              });
              const avgChange =
                changes.length > 0
                  ? changes.reduce((sum, change) => sum + change, 0) / changes.length
                  : 0;

              return (
                <>
                  <div
                    className={`text-body font-semibold ${
                      avgChange > 0
                        ? "text-brand-green"
                        : avgChange < 0
                          ? "text-brand-red"
                          : "text-brand-gray-04"
                    }`}
                  >
                    {avgChange > 0 ? "+" : ""}
                    {avgChange.toFixed(1)}
                  </div>
                  <div className="text-label text-brand-gray-03 uppercase">Avg Change</div>
                </>
              );
            })()}
          </div>

          {/* Biggest Gain */}
          <div>
            {(() => {
              const changes = recentMatches.map((match) => getMatchInfo(match).scoreChange);
              const maxGain = changes.length > 0 ? Math.max(...changes) : 0;

              return (
                <>
                  <div className="text-body font-semibold text-brand-green">+{maxGain}</div>
                  <div className="text-label text-brand-gray-03 uppercase">Best Gain</div>
                </>
              );
            })()}
          </div>

          {/* Biggest Loss */}
          <div>
            {(() => {
              const changes = recentMatches.map((match) => getMatchInfo(match).scoreChange);
              const maxLoss = changes.length > 0 ? Math.min(...changes) : 0;

              return (
                <>
                  <div className="text-body font-semibold text-brand-red">{maxLoss}</div>
                  <div className="text-label text-brand-gray-03 uppercase">Worst Loss</div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
