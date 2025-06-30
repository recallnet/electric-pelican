"use client";

import { WinRateIndicator } from "@/components/leaderboard/WinRateIndicator";
import { GlassPanel } from "@/components/ui/glass-panel";
import { type PerformanceSectionProps } from "@/types/components";

import { ELOChart } from "./ELOChart";

/**
 * Performance overview section showing ELO history chart and key performance metrics.
 * Displays trends, win/loss distribution, and performance analytics.
 */
export function PerformanceSection({ modelStats }: PerformanceSectionProps) {
  const { modelScore, eloHistory } = modelStats;

  // Calculate performance metrics
  const totalMatches = modelScore.matchesPlayed;
  const winPercentage = modelScore.winRate * 100;
  const lossPercentage = (1 - modelScore.winRate) * 100;

  // Calculate recent performance (last 10 matches)
  const recentHistory = eloHistory.slice(-10);
  const recentWins = recentHistory.filter((entry) => entry.change > 0).length;
  const recentWinRate = recentHistory.length > 0 ? (recentWins / recentHistory.length) * 100 : 0;

  // Calculate ELO change statistics
  const eloChanges = eloHistory.map((entry) => entry.change);
  const averageChange =
    eloChanges.length > 0
      ? eloChanges.reduce((sum, change) => sum + change, 0) / eloChanges.length
      : 0;
  const maxGain = eloChanges.length > 0 ? Math.max(...eloChanges) : 0;
  const maxLoss = eloChanges.length > 0 ? Math.min(...eloChanges) : 0;

  return (
    <div className="space-y-6">
      {/* ELO History Chart */}
      <GlassPanel className="p-6">
        <h2 className="text-headline text-brand-black mb-4">ELO Score History</h2>
        <ELOChart eloHistory={eloHistory} />
      </GlassPanel>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Distribution */}
        <GlassPanel className="p-6">
          <h3 className="text-headline text-brand-black mb-4">Win/Loss Distribution</h3>

          {totalMatches > 0 ? (
            <div className="space-y-4">
              {/* Win Rate Indicator */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body text-brand-gray-04">Overall Win Rate</span>
                  <span className="text-body font-semibold text-brand-black">
                    {winPercentage.toFixed(1)}%
                  </span>
                </div>
                <WinRateIndicator
                  winRate={modelScore.winRate}
                  wins={modelScore.wins}
                  losses={modelScore.losses}
                />
              </div>

              {/* Recent Performance */}
              {recentHistory.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body text-brand-gray-04">
                      Recent Win Rate (Last {recentHistory.length})
                    </span>
                    <span
                      className={`text-body font-semibold ${
                        recentWinRate >= 70
                          ? "text-brand-green"
                          : recentWinRate >= 50
                            ? "text-brand-yellow"
                            : "text-brand-red"
                      }`}
                    >
                      {recentWinRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-brand-gray-01 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        recentWinRate >= 70
                          ? "bg-brand-green"
                          : recentWinRate >= 50
                            ? "bg-brand-yellow"
                            : "bg-brand-red"
                      }`}
                      style={{ width: `${recentWinRate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Win/Loss Breakdown */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-brand-green/10 rounded-lg">
                  <div className="text-headline text-brand-green font-semibold">
                    {modelScore.wins}
                  </div>
                  <div className="text-label text-brand-gray-03 uppercase">
                    Wins ({winPercentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-center p-3 bg-brand-red/10 rounded-lg">
                  <div className="text-headline text-brand-red font-semibold">
                    {modelScore.losses}
                  </div>
                  <div className="text-label text-brand-gray-03 uppercase">
                    Losses ({lossPercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-body text-brand-gray-04">No matches played yet</p>
            </div>
          )}
        </GlassPanel>

        {/* ELO Change Statistics */}
        <GlassPanel className="p-6">
          <h3 className="text-headline text-brand-black mb-4">ELO Change Statistics</h3>

          {eloHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Average Change */}
              <div className="flex justify-between items-center p-3 bg-brand-gray-01/30 rounded-lg">
                <span className="text-body text-brand-gray-04">Average Change</span>
                <span
                  className={`text-body font-semibold ${
                    averageChange > 0
                      ? "text-brand-green"
                      : averageChange < 0
                        ? "text-brand-red"
                        : "text-brand-gray-04"
                  }`}
                >
                  {averageChange > 0 ? "+" : ""}
                  {averageChange.toFixed(1)}
                </span>
              </div>

              {/* Biggest Gain */}
              <div className="flex justify-between items-center p-3 bg-brand-green/10 rounded-lg">
                <span className="text-body text-brand-gray-04">Biggest Gain</span>
                <span className="text-body font-semibold text-brand-green">+{maxGain}</span>
              </div>

              {/* Biggest Loss */}
              <div className="flex justify-between items-center p-3 bg-brand-red/10 rounded-lg">
                <span className="text-body text-brand-gray-04">Biggest Loss</span>
                <span className="text-body font-semibold text-brand-red">{maxLoss}</span>
              </div>

              {/* Current Streak */}
              <div className="mt-4 p-3 bg-brand-blue/10 rounded-lg">
                <div className="text-center">
                  <div className="text-body text-brand-gray-04 mb-1">Current ELO</div>
                  <div className="text-headline text-brand-blue font-bold">
                    {modelScore.globalScore.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-body text-brand-gray-04">No ELO history available</p>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
