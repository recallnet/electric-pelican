"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { cn } from "@/lib/utils";
import type { TaxonomyNode } from "@/types/taxonomy";

import { CapabilityCard } from "./CapabilityCard";

interface CapabilitiesTreeViewProps {
  nodes: TaxonomyNode[];
  isLoading?: boolean;
  onNodeClick?: (nodeData: { attributes: { id: string }; name: string }) => void;
  className?: string;
}

/**
 * Clean, minimalist table view of capabilities hierarchy
 *
 * Features:
 * - Proper table structure like other app tables
 * - Clean hierarchy with indentation and brand color indicators
 * - GlassPanel wrapper for consistency
 * - Search functionality matching app patterns
 * - Mobile-responsive with dedicated card layout
 * - Responsive column widths for medium screens
 */
export function CapabilitiesTreeView({
  nodes,
  isLoading,
  onNodeClick,
  className,
}: CapabilitiesTreeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Flatten the tree into a simple list with hierarchy levels
   */
  const flattenedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];

    const flattened: Array<TaxonomyNode & { depth: number }> = [];

    const flatten = (nodeList: TaxonomyNode[], depth = 0) => {
      nodeList.forEach((node) => {
        flattened.push({ ...node, depth });
        if (node.children && node.children.length > 0) {
          flatten(node.children, depth + 1);
        }
      });
    };

    flatten(nodes);
    return flattened;
  }, [nodes]);

  /**
   * Filter nodes based on search term
   */
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return flattenedNodes;

    return flattenedNodes.filter(
      (node) =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [flattenedNodes, searchTerm]);

  /**
   * Get brand color indicator based on hierarchy level
   */
  const getLevelIndicator = (level: number) => {
    switch (level) {
      case 1:
        return "w-2 h-2 rounded-full bg-brand-blue";
      case 2:
        return "w-2 h-2 rounded-full bg-brand-green";
      case 3:
        return "w-2 h-2 rounded-full bg-brand-yellow";
      default:
        return "w-2 h-2 rounded-full bg-brand-gray-02";
    }
  };

  /**
   * Get text styling based on hierarchy level
   */
  const getLevelTextStyle = (level: number) => {
    switch (level) {
      case 1:
        return "text-brand-blue font-semibold";
      case 2:
        return "text-brand-green font-medium";
      case 3:
        return "text-brand-yellow font-normal";
      default:
        return "text-brand-gray-04 font-normal";
    }
  };

  /**
   * Handle row click
   */
  const handleRowClick = (node: TaxonomyNode) => {
    if (onNodeClick) {
      onNodeClick({ attributes: { id: node.id }, name: node.name });
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
          <p className="text-body text-brand-gray-04">Loading capabilities...</p>
        </div>
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          <div className="text-4xl">🌳</div>
          <p className="text-body text-brand-gray-04">No capability data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-03" />
        <input
          type="text"
          placeholder="Search capabilities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border border-brand-gray-02 pl-10 pr-4 py-2 text-body bg-brand-white focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          aria-label="Search capabilities"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-03 hover:text-brand-red transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <GlassPanel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-brand-gray-02">
                  <th className="text-left py-3 px-2 lg:px-4 text-xs font-medium text-brand-black uppercase tracking-wide w-[35%] lg:w-[40%]">
                    Capability
                  </th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs font-medium text-brand-black uppercase tracking-wide w-[30%] lg:w-[25%]">
                    Leading Model
                  </th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs font-medium text-brand-black uppercase tracking-wide w-[20%] lg:w-[20%]">
                    ELO Score
                  </th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs font-medium text-brand-black uppercase tracking-wide w-[15%] lg:w-[15%]">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => {
                  // Use simpler indentation - reduce from 24px to 20px per level for better space usage
                  const indentPx = node.depth * 20;

                  return (
                    <tr
                      key={node.id}
                      onClick={() => handleRowClick(node)}
                      className="border-b border-brand-gray-01 hover:bg-brand-gray-01/50 cursor-pointer transition-colors"
                    >
                      {/* Capability Name with Hierarchy */}
                      <td className="py-2 lg:py-3 px-2 lg:px-4 w-[35%] lg:w-[40%]">
                        <div className="flex items-center" style={{ paddingLeft: `${indentPx}px` }}>
                          <div className={cn("mr-2 lg:mr-3", getLevelIndicator(node.level))}></div>
                          <div className="min-w-0 flex-1">
                            <h3
                              className={cn(
                                "truncate text-xs lg:text-sm",
                                getLevelTextStyle(node.level),
                              )}
                            >
                              {node.name}
                            </h3>
                            {node.description && node.level <= 2 && (
                              <p className="text-xs text-brand-gray-03 truncate mt-0.5 hidden lg:block">
                                {node.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Leading Model */}
                      <td className="py-2 lg:py-3 px-2 lg:px-4 w-[30%] lg:w-[25%]">
                        {node.leadingModel ? (
                          <div className="min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/models/${node.leadingModel!.modelId}`, "_blank");
                              }}
                              className="text-xs lg:text-sm font-medium text-brand-black hover:text-brand-blue transition-colors truncate block w-full text-left"
                              title={node.leadingModel.modelName}
                            >
                              {node.leadingModel.modelName}
                            </button>
                            <p className="text-xs text-brand-gray-03 truncate">
                              {node.leadingModel.provider}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs lg:text-sm text-brand-gray-03">No data</span>
                        )}
                      </td>

                      {/* ELO Score */}
                      <td className="py-2 lg:py-3 px-2 lg:px-4 w-[20%] lg:w-[20%]">
                        {node.leadingModel ? (
                          <div className="text-right">
                            <div className="text-xs lg:text-sm font-mono font-semibold text-brand-black">
                              {Math.round(node.leadingModel.eloScore)}
                            </div>
                            <div className="text-xs text-brand-gray-03">
                              #{node.leadingModel.rank}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs lg:text-sm text-brand-gray-03 text-right block">
                            —
                          </span>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="py-2 lg:py-3 px-2 lg:px-4 w-[15%] lg:w-[15%]">
                        {node.stats ? (
                          <div className="text-right">
                            <div className="text-xs lg:text-sm font-mono text-brand-black">
                              {node.stats.totalMatches >= 1000
                                ? `${(node.stats.totalMatches / 1000).toFixed(1)}k`
                                : node.stats.totalMatches}
                              <span className="text-xs text-brand-gray-03 ml-1">matches</span>
                            </div>
                            <div className="text-xs text-brand-gray-03">
                              {node.stats.totalModels} models
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs lg:text-sm text-brand-gray-03 text-right block">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredNodes.map((node) => (
          <CapabilityCard key={node.id} node={node} onNodeClick={onNodeClick} />
        ))}
      </div>

      {/* Results Summary */}
      <div className="text-center text-sm text-brand-gray-03">
        Showing {filteredNodes.length} of {flattenedNodes.length} capabilities
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
}
