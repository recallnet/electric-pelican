"use client";

import { type WinRateIndicatorProps } from "@/types/components";

/**
 * Displays win rate as a percentage with color-coded progress bar.
 * Shows wins/losses on hover for additional context.
 */
export function WinRateIndicator({ winRate, wins, losses }: WinRateIndicatorProps) {
  const percentage = Math.round(winRate * 100);

  // Color coding based on win rate
  const getColorClass = (rate: number) => {
    if (rate >= 0.7) return "bg-brand-green";
    if (rate >= 0.5) return "bg-brand-yellow";
    return "bg-brand-red";
  };

  const getTextColorClass = (rate: number) => {
    if (rate >= 0.7) return "text-brand-green";
    if (rate >= 0.5) return "text-brand-yellow";
    return "text-brand-red";
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-label font-semibold ${getTextColorClass(winRate)}`}>
          {percentage}%
        </span>
        <div className="flex-1 bg-brand-gray-01 rounded-full h-2 min-w-[60px]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getColorClass(winRate)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-xs text-brand-gray-03">
        {wins}W / {losses}L
      </div>
    </div>
  );
}
