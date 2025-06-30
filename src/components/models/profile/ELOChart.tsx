"use client";

import { type ELOChartProps } from "@/types/components";

/**
 * ELO history chart showing score changes over time.
 * Uses Chart.js for visualization with custom styling.
 */
export function ELOChart({ eloHistory }: ELOChartProps) {
  // Calculate min/max scores for y-axis
  const scores = eloHistory.map((entry) => entry.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Format data for Chart.js

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (eloHistory.length === 0) {
    return (
      <div className="h-64 bg-brand-gray-01/30 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-brand-gray-03 mb-2">No ELO history available</p>
          <p className="text-label text-brand-gray-03">Chart will appear after first matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Statistics */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-body font-semibold text-brand-green">
            {maxScore.toLocaleString()}
          </div>
          <div className="text-label text-brand-gray-03 uppercase">Peak Score</div>
        </div>
        <div>
          <div className="text-body font-semibold text-brand-blue">{eloHistory.length}</div>
          <div className="text-label text-brand-gray-03 uppercase">Data Points</div>
        </div>
        <div>
          <div className="text-body font-semibold text-brand-red">{minScore.toLocaleString()}</div>
          <div className="text-label text-brand-gray-03 uppercase">Lowest Score</div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="h-64 bg-brand-gray-01/30 rounded-lg p-4 relative overflow-hidden">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-2 text-xs text-brand-gray-03">
          {maxScore.toLocaleString()}
        </div>
        <div className="absolute left-2 bottom-2 text-xs text-brand-gray-03">
          {minScore.toLocaleString()}
        </div>

        {/* Chart area */}
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-brand-blue/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-brand-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-body text-brand-gray-03 mb-1">Interactive ELO Chart</p>
            <p className="text-label text-brand-gray-03">Chart visualization coming soon</p>
          </div>
        </div>

        {/* Simple visual representation */}
        {eloHistory.length > 1 && (
          <div className="absolute bottom-8 left-8 right-8 h-1 bg-brand-gray-02 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-blue to-brand-green rounded-full opacity-50" />
          </div>
        )}
      </div>

      {/* Recent Data Points */}
      {eloHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-body font-semibold text-brand-black">Recent Changes</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {eloHistory
              .slice(-5)
              .reverse()
              .map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm p-2 bg-brand-gray-01/20 rounded"
                >
                  <span className="text-brand-gray-04">{formatDate(entry.date)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-black font-medium">
                      {entry.score.toLocaleString()}
                    </span>
                    <span
                      className={`font-semibold ${
                        entry.change > 0
                          ? "text-brand-green"
                          : entry.change < 0
                            ? "text-brand-red"
                            : "text-brand-gray-04"
                      }`}
                    >
                      {entry.change > 0 ? "+" : ""}
                      {entry.change}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
