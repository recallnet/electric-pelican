"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaxonomyNode } from "@/types/taxonomy";

interface TaxonomyNodeProps {
  node: TaxonomyNode;
  level: number;
  searchTerm?: string;
  onTagClick?: (tagId: string, name: string) => void;
}

/**
 * TaxonomyNode Component
 *
 * Renders an individual node in the taxonomy tree with leading model information,
 * statistics, and navigation links. Handles recursive rendering of child nodes.
 */
export function TaxonomyNode({
  node,
  level,
  searchTerm = "",

  onTagClick,
}: TaxonomyNodeProps) {
  const isSearchMatch = searchTerm
    ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchTerm.toLowerCase())
    : false;

  const handleClick = () => {
    if (onTagClick) {
      onTagClick(node.id, node.name);
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  // Get proper indentation based on node level
  const getIndentLevel = () => {
    switch (node.level) {
      case 1:
        return "pl-0"; // L1 Pillars - no indent
      case 2:
        return "pl-6"; // L2 Families - 24px indent
      case 3:
        return "pl-12"; // L3 Leaves - 48px indent
      default:
        return "pl-0";
    }
  };

  // Visual hierarchy indicators
  const getHierarchyIndicator = () => {
    switch (node.level) {
      case 1:
        return "■"; // Solid square for pillars
      case 2:
        return "▣"; // Outlined square for families
      case 3:
        return "□"; // Empty square for leaves
      default:
        return "●";
    }
  };

  // Get color scheme based on level
  const getColorScheme = () => {
    switch (node.level) {
      case 1:
        return {
          indicator: "text-blue-600",
          border: "border-l-4 border-blue-300",
          bg: "bg-blue-50/50",
          hover: "hover:bg-blue-100/50",
        };
      case 2:
        return {
          indicator: "text-green-600",
          border: "border-l-3 border-green-300",
          bg: "bg-green-50/50",
          hover: "hover:bg-green-100/50",
        };
      case 3:
        return {
          indicator: "text-amber-600",
          border: "border-l-2 border-amber-300",
          bg: "bg-amber-50/50",
          hover: "hover:bg-amber-100/50",
        };
      default:
        return {
          indicator: "text-gray-600",
          border: "border-l-2 border-gray-300",
          bg: "bg-gray-50/50",
          hover: "hover:bg-gray-100/50",
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div className={cn("w-full", getIndentLevel())}>
      {/* Main Node Row */}
      <div
        className={cn(
          "flex items-center justify-between py-1.5 px-3 rounded-lg transition-all duration-200",
          colors.bg,
          colors.hover,
          colors.border,
          "cursor-pointer group",
          isSearchMatch && "ring-2 ring-yellow-300 bg-yellow-100",
        )}
        onClick={handleClick}
      >
        {/* Left side: Hierarchy indicator + Name */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className={cn("text-base font-mono", colors.indicator)}>
            {getHierarchyIndicator()}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3
                className={cn(
                  "font-medium text-gray-900 truncate",
                  node.level === 1 && "text-base font-semibold",
                  node.level === 2 && "text-sm font-medium",
                  node.level === 3 && "text-xs",
                )}
              >
                {node.name}
              </h3>

              {/* Link to leaderboard */}
              <Link
                href={`/leaderboard/capability/${node.id}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Badge variant="outline" className="text-xs hover:bg-blue-50">
                  View Leaderboard
                </Badge>
              </Link>
            </div>

            {node.description && node.level <= 2 && (
              <p className="text-xs text-gray-600 truncate mt-0.5">{node.description}</p>
            )}
          </div>
        </div>

        {/* Right side: Model info + Stats */}
        <div className="flex items-center space-x-6 flex-shrink-0">
          {/* Leading Model */}
          <div className="text-right min-w-0">
            {node.leadingModel ? (
              <div className="flex flex-col items-end">
                <Link
                  href={`/models/${node.leadingModel.modelId}`}
                  className="text-xs font-normal text-gray-900 hover:text-blue-600 transition-colors truncate max-w-64"
                  onClick={(e) => e.stopPropagation()}
                >
                  {node.leadingModel.modelName}
                </Link>
                <div className="text-xs text-gray-500">
                  {Math.round(node.leadingModel.eloScore)}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No data</div>
            )}
          </div>

          {/* Stats */}
          <div className="flex space-x-3 text-xs text-gray-500 font-mono min-w-0">
            <span className="truncate">
              {node.stats?.totalMatches
                ? node.stats.totalMatches >= 1000
                  ? `${Math.round(node.stats.totalMatches / 1000)}k`
                  : node.stats.totalMatches.toString()
                : "0"}
              m
            </span>
            <span className="truncate">{node.stats?.totalModels || "0"}t</span>
          </div>
        </div>
      </div>

      {/* Child nodes */}
      {hasChildren && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TaxonomyNode
              key={child.id}
              node={child}
              level={level + 1}
              searchTerm={searchTerm}
              {...(onTagClick && { onTagClick })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
