"use client";

import { ExternalLink } from "lucide-react";

import { ModelRankBadge } from "@/components/leaderboard/ModelRankBadge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { type ModelHeaderProps } from "@/types/components";

/**
 * Header section for model profile page displaying key information and stats.
 * Includes model name, ELO score, rank badge, and key statistics.
 */
export function ModelHeader({ modelStats }: ModelHeaderProps) {
  const { modelScore, eloHistory } = modelStats;

  // Calculate average ELO change

  // Extract model name from ID (e.g., "anthropic/claude-3-sonnet" -> "Claude 3 Sonnet")
  const formatModelName = (modelId: string): string => {
    const parts = modelId.split("/");
    const modelName = parts[parts.length - 1] || modelId;

    // Convert kebab-case to title case
    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Extract provider from ID (e.g., "anthropic/claude-3-sonnet" -> "Anthropic")
  const formatProviderName = (modelId: string): string => {
    const parts = modelId.split("/");
    const provider = parts[0] || "Unknown";
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  // Generate OpenRouter URL
  const openRouterUrl = `https://openrouter.ai/models/${modelScore.modelId}`;

  // Calculate ELO trend from recent history
  const getEloTrend = () => {
    if (eloHistory.length < 2) return null;

    const recent = eloHistory.slice(-5); // Last 5 matches
    const totalChange = recent.reduce((sum, entry) => sum + entry.change, 0);

    if (totalChange > 0) return "up";
    if (totalChange < 0) return "down";
    return "stable";
  };

  const eloTrend = getEloTrend();

  return (
    <GlassPanel className="p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Model Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-display text-brand-black font-bold mb-1">
                {formatModelName(modelScore.modelId)}
              </h1>
              <p className="text-body text-brand-gray-04">
                by {formatProviderName(modelScore.modelId)}
              </p>
            </div>

            {/* Rank Badge */}
            <ModelRankBadge rank={modelScore.rank} />
          </div>

          {/* OpenRouter Link */}
          <a
            href={openRouterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-blue hover:underline text-body font-medium transition-colors"
            aria-label={`Learn more about ${formatModelName(modelScore.modelId)} on OpenRouter`}
          >
            <span>View on OpenRouter</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* ELO Score */}
        <div className="text-center lg:text-right">
          <div className="flex items-center gap-2 justify-center lg:justify-end mb-1">
            <div className="text-display text-brand-blue font-bold">
              {modelScore.globalScore.toLocaleString()}
            </div>
            {eloTrend && (
              <div
                className={`text-sm font-medium ${
                  eloTrend === "up"
                    ? "text-brand-green"
                    : eloTrend === "down"
                      ? "text-brand-red"
                      : "text-brand-gray-04"
                }`}
              >
                {eloTrend === "up" ? "↗" : eloTrend === "down" ? "↘" : "→"}
              </div>
            )}
          </div>
          <div className="text-label text-brand-gray-03 uppercase">ELO Rating</div>
        </div>
      </div>

      {/* Key Statistics - Streamlined */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-4 pt-3 border-t border-white/20 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-brand-gray-03">Matches:</span>
          <span className="font-medium">{modelScore.matchesPlayed.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-brand-gray-03">Win Rate:</span>
          <span
            className={`font-medium ${
              modelScore.winRate >= 0.7
                ? "text-brand-green"
                : modelScore.winRate >= 0.5
                  ? "text-brand-yellow"
                  : "text-brand-red"
            }`}
          >
            {(modelScore.winRate * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-brand-gray-03">W/L:</span>
          <span className="font-medium">
            <span className="text-brand-green">{modelScore.wins.toLocaleString()}</span>
            <span className="mx-0.5">/</span>
            <span className="text-brand-red">{modelScore.losses.toLocaleString()}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-brand-gray-03">Last active:</span>
          <span className="font-medium">
            {new Date(modelScore.lastActive).toLocaleDateString()}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
