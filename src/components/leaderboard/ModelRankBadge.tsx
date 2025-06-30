"use client";

import { type ModelRankBadgeProps } from "@/types/components";

/**
 * Displays a model's rank with special styling for top positions.
 * Top 3 positions get medal-style badges, others get standard rank display.
 */
export function ModelRankBadge({ rank }: ModelRankBadgeProps) {
  // Special styling for top 3 positions
  if (rank === 1) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-md text-label font-bold shadow-e1">
          #1
        </div>
        <span className="text-xl" role="img" aria-label="Gold medal">
          🥇
        </span>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-gradient-to-r from-gray-300 to-gray-500 text-white rounded-md text-label font-bold shadow-e1">
          #2
        </div>
        <span className="text-xl" role="img" aria-label="Silver medal">
          🥈
        </span>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-md text-label font-bold shadow-e1">
          #3
        </div>
        <span className="text-xl" role="img" aria-label="Bronze medal">
          🥉
        </span>
      </div>
    );
  }

  // Top 10 get special blue styling
  if (rank <= 10) {
    return (
      <div
        className="px-2 py-1 bg-brand-blue text-white rounded-md text-label font-semibold shadow-e1"
        style={{ color: "#FFFFFF" }}
      >
        #{rank}
      </div>
    );
  }

  // Standard rank styling for others
  return (
    <div className="px-2 py-1 bg-brand-gray-02 text-brand-gray-04 rounded-md text-label font-medium">
      #{rank}
    </div>
  );
}
