"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";
import type { TaxonomyNode } from "@/types/taxonomy";

interface CapabilityCardProps {
  node: TaxonomyNode & { depth: number };
  onNodeClick?: (nodeData: { attributes: { id: string }; name: string }) => void;
}

/**
 * Mobile card component for capability display
 *
 * Features:
 * - Glassmorphic design matching app style
 * - Minimal hierarchical indentation for mobile (8px per level)
 * - Brand color indicators for levels
 * - Visual hierarchy prefixes (chevrons) for clear nesting
 * - Interactive model links
 * - Compact stats display
 */
export function CapabilityCard({ node, onNodeClick }: CapabilityCardProps) {
  const getLevelIndicator = (level: number) => {
    switch (level) {
      case 1:
        return { color: "bg-brand-blue", text: "text-brand-blue" };
      case 2:
        return { color: "bg-brand-green", text: "text-brand-green" };
      case 3:
        return { color: "bg-brand-yellow", text: "text-brand-yellow" };
      default:
        return { color: "bg-brand-gray-02", text: "text-brand-gray-04" };
    }
  };

  const getHierarchyPrefix = (level: number) => {
    switch (level) {
      case 1:
        return ""; // No prefix for top level
      case 2:
        return "› "; // Single chevron for L2
      case 3:
        return "›› "; // Double chevron for L3
      default:
        return "››› "; // Triple chevron for deeper levels
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick({ attributes: { id: node.id }, name: node.name });
    }
  };

  const levelStyle = getLevelIndicator(node.level);
  const hierarchyPrefix = getHierarchyPrefix(node.level);
  const indent = node.depth * 8; // Reduced indent for mobile - chevrons provide hierarchy clarity

  return (
    <GlassPanel intensity="light" className="p-4" onClick={handleClick}>
      {/* Header: Capability Name + Level Indicator */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1" style={{ paddingLeft: `${indent}px` }}>
            <div className={cn("w-2 h-2 rounded-full", levelStyle.color)}></div>
            <h3 className={cn("font-medium text-sm line-clamp-2", levelStyle.text)}>
              <span className="text-brand-gray-04 font-normal mr-1">{hierarchyPrefix}</span>
              {node.name}
            </h3>
          </div>
          {node.description && node.level <= 2 && (
            <p
              className="text-xs text-brand-gray-03 line-clamp-1"
              style={{ paddingLeft: `${indent + 24}px` }}
            >
              {node.description}
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-brand-gray-04 whitespace-nowrap">
          L{node.level}
        </span>
      </div>

      {/* Content: Leading Model + ELO */}
      <div className="space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-gray-04 mb-1">Leading Model</p>
            {node.leadingModel ? (
              <div className="min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/models/${node.leadingModel!.modelId}`, "_blank");
                  }}
                  className="text-sm font-medium text-brand-black hover:text-brand-blue transition-colors truncate block"
                  title={node.leadingModel.modelName}
                >
                  {node.leadingModel.modelName}
                </button>
                <p className="text-xs text-brand-gray-03 truncate">{node.leadingModel.provider}</p>
              </div>
            ) : (
              <span className="text-sm text-brand-gray-03">No data</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-brand-gray-04 mb-1">ELO Score</p>
            {node.leadingModel ? (
              <div>
                <div className="text-sm font-mono font-semibold text-brand-black">
                  {Math.round(node.leadingModel.eloScore)}
                </div>
                <div className="text-xs text-brand-gray-03">#{node.leadingModel.rank}</div>
              </div>
            ) : (
              <span className="text-sm text-brand-gray-03">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Stats */}
      <div className="flex items-center justify-between text-xs text-brand-gray-04">
        <div>
          {node.stats ? (
            <div className="flex items-center gap-4">
              <span>
                {node.stats.totalMatches >= 1000
                  ? `${(node.stats.totalMatches / 1000).toFixed(1)}k`
                  : node.stats.totalMatches}{" "}
                matches
              </span>
              <span>{node.stats.totalModels} models</span>
            </div>
          ) : (
            <span>No stats available</span>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
