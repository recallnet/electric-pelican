"use client";

/**
 * @file CapabilityBadge - Display capability tags with ELO scores
 * @description Shows capability badges with hierarchical information and ELO scores
 */

import { Badge } from "@/components/ui/badge";
import { getTagInfo, getTagLineage } from "@/lib/tag-taxonomy";
import { cn } from "@/lib/utils";
import type { CapabilityBadgeProps } from "@/types/router-ui";

/**
 * Capability badge component with ELO score and tooltip
 */
export default function CapabilityBadge({
  capability,
  eloScore,
  rank,
  showRank = false,
  size = "sm",
  showTooltip = true,
}: CapabilityBadgeProps) {
  const tagInfo = getTagInfo(capability);
  const lineage = getTagLineage(capability);

  // Determine badge variant based on ELO score
  const getVariant = () => {
    if (!eloScore) return "outline";
    if (eloScore >= 1600) return "default"; // High ELO - green
    if (eloScore >= 1400) return "secondary"; // Medium ELO - blue
    return "outline"; // Lower ELO - gray
  };

  // Create tooltip content
  const tooltipContent = showTooltip ? (
    <div className="max-w-xs space-y-2">
      <div className="font-semibold">{tagInfo?.name || capability}</div>
      {tagInfo?.description && <div className="text-sm text-gray-600">{tagInfo.description}</div>}
      {lineage.length > 0 && (
        <div className="text-xs text-gray-500">{lineage.map((tag) => tag.name).join(" → ")}</div>
      )}
      {eloScore && (
        <div className="pt-2 border-t border-gray-200 space-y-1">
          <div className="text-sm font-medium">ELO Score: {Math.round(eloScore)}</div>
          {rank && showRank && <div className="text-sm">Rank: #{rank}</div>}
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <div
      className="relative group"
      title={
        showTooltip
          ? `${tagInfo?.name || capability}${eloScore ? ` (ELO: ${Math.round(eloScore)})` : ""}`
          : undefined
      }
    >
      <Badge
        variant={getVariant()}
        className={cn(
          "cursor-help transition-all duration-200 hover:scale-105",
          "bg-brand-blue/10 text-brand-blue border-brand-blue/20 hover:bg-brand-blue/20",
          size === "xs" && "text-xs px-1.5 py-0.5",
          size === "sm" && "text-xs px-2 py-1",
          size === "md" && "text-sm px-3 py-1.5",
          size === "lg" && "text-base px-4 py-2",
          eloScore &&
            eloScore >= 1600 &&
            "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",
          eloScore &&
            eloScore >= 1400 &&
            eloScore < 1600 &&
            "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
        )}
      >
        <span className="flex items-center space-x-1">
          <span>📊</span>
          <span>{tagInfo?.name || capability}</span>
          {eloScore && <span className="text-xs opacity-75">({Math.round(eloScore)})</span>}
        </span>
      </Badge>

      {/* Tooltip */}
      {showTooltip && tooltipContent && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
          <div className="bg-black/90 text-white text-xs rounded-lg p-3 whitespace-nowrap max-w-xs">
            <div className="font-semibold">{tagInfo?.name || capability}</div>
            {tagInfo?.description && (
              <div className="text-gray-300 mt-1">{tagInfo.description}</div>
            )}
            {lineage.length > 0 && (
              <div className="text-gray-400 text-xs mt-1">
                {lineage.map((tag) => tag.name).join(" → ")}
              </div>
            )}
            {eloScore && (
              <div className="text-gray-200 mt-2 pt-2 border-t border-gray-600">
                ELO: {Math.round(eloScore)}
                {rank && showRank && <span className="ml-2">Rank: #{rank}</span>}
              </div>
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
          </div>
        </div>
      )}
    </div>
  );
}
