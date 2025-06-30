"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type LeaderboardStatsProps } from "@/types/components";

/**
 * Overview statistics for the leaderboard showing total models and other metrics.
 * Displays in a glassmorphic panel with loading states.
 */
export function LeaderboardStats({ totalModels, isLoading }: LeaderboardStatsProps) {
  if (isLoading) {
    return (
      <GlassPanel className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-brand-gray-02 rounded w-16 mx-auto mb-2"></div>
              <div className="h-4 bg-brand-gray-02 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-display text-brand-black font-bold">
            {totalModels.toLocaleString()}
          </div>
          <div className="text-label text-brand-gray-04 uppercase">Models Ranked</div>
        </div>

        <div>
          <div className="text-display text-brand-blue font-bold">ELO</div>
          <div className="text-label text-brand-gray-04 uppercase">Rating System</div>
        </div>

        <div>
          <div className="text-display text-brand-green font-bold">Live</div>
          <div className="text-label text-brand-gray-04 uppercase">Real-time Updates</div>
        </div>
      </div>
    </GlassPanel>
  );
}
