"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { CapabilitiesTreeView } from "@/components/capabilities/CapabilitiesTreeView";
import { GlassPanel } from "@/components/ui/glass-panel";
import { TAGS } from "@/lib/tag-taxonomy";
import type { TaxonomyNode } from "@/types/taxonomy";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * AI Capability Taxonomy Page
 *
 * Displays the complete hierarchy of AI capabilities as an interactive tree.
 * Each node shows the leading model for that capability along with statistics.
 * Accessible at /capabilities but not linked in main navigation.
 */
export default function TaxonomyPage() {
  // Fetch all taxonomy data efficiently with single API call
  const {
    data: apiResponse,
    error: leaderboardError,
    isLoading: isLoadingLeaderboards,
  } = useSWR("/api/taxonomy/leaderboard-overview", fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes instead of 1 minute
    revalidateOnFocus: false, // Don't refetch on focus to avoid spam
    dedupingInterval: 240000, // Dedupe requests within 4 minutes
  });

  // Extract data from API response
  const leaderboardData = apiResponse?.taxonomyData;
  const overallStatsFromAPI = apiResponse?.overallStats;

  // Build hierarchical tree structure
  const taxonomyTree = useMemo(() => {
    if (!leaderboardData) return [];

    const nodeMap = new Map<string, TaxonomyNode>();

    // Create nodes for all tags
    TAGS.forEach((tag) => {
      const level = tag.parentId ? (TAGS.find((t) => t.id === tag.parentId)?.parentId ? 3 : 2) : 1;

      const leaderboard = leaderboardData[tag.id];
      const leadingModel = leaderboard?.models?.[0];

      nodeMap.set(tag.id, {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        parentId: tag.parentId,
        level: level as 1 | 2 | 3,
        leadingModel: leadingModel
          ? {
              modelId: leadingModel.modelId,
              modelName: leadingModel.modelName || leadingModel.modelId,
              provider: leadingModel.provider || "Unknown",
              eloScore: leadingModel.globalScore || leadingModel.eloScore,
              rank: leadingModel.rank || 1,
            }
          : undefined,
        stats: leaderboard?.stats
          ? {
              totalModels: leaderboard.stats.totalModels,
              totalMatches: leaderboard.stats.totalMatches,
              averageElo: leaderboard.stats.averageElo,
            }
          : undefined,
        children: [],
      });
    });

    // Build parent-child relationships
    nodeMap.forEach((node) => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      }
    });

    // Return root nodes (L1 pillars)
    return Array.from(nodeMap.values()).filter((node) => !node.parentId);
  }, [leaderboardData]);

  // Use overall statistics from API response when available
  const overallStats = useMemo(() => {
    if (overallStatsFromAPI) {
      return overallStatsFromAPI;
    }

    // Fallback calculation if API doesn't provide overall stats
    if (!leaderboardData) return null;

    const allLeaderboards = Object.values(leaderboardData);
    const totalModels = new Set(
      allLeaderboards.flatMap((lb) => (lb as any)?.models?.map((m: any) => m.modelId) || []),
    ).size;

    const totalMatches = allLeaderboards.reduce(
      (sum, lb) => sum + ((lb as any)?.stats?.totalMatches || 0),
      0,
    );

    const totalCapabilities = TAGS.length;

    return {
      totalModels,
      totalCapabilities,
      totalMatches,
    };
  }, [leaderboardData, overallStatsFromAPI]);

  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-display text-brand-black">AI Capability Taxonomy</h1>
          <p className="text-body text-brand-gray-04 max-w-2xl mx-auto">
            Explore the complete hierarchy of AI capabilities and discover which models lead in each
            area. Interactive tree showing ELO rankings across all capability domains.
          </p>
        </div>

        {/* Performance Info */}
        {apiResponse?.meta && (
          <div className="text-center">
            <p className="text-label text-brand-gray-03">
              🚀 Loaded {apiResponse.meta.capabilitiesReturned} capabilities in{" "}
              {apiResponse.meta.queryTimeMs}ms
              {apiResponse.meta.cacheHint &&
                ` • Cached for ${apiResponse.meta.cacheHint.split("=")[1]} seconds`}
            </p>
          </div>
        )}

        {/* Overall Statistics */}
        {overallStats && (
          <GlassPanel className="p-6">
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-headline text-brand-black font-semibold">
                  {overallStats.totalModels.toLocaleString()}
                </div>
                <div className="text-label text-brand-gray-04">Total Models</div>
              </div>

              <div>
                <div className="text-headline text-brand-black font-semibold">
                  {overallStats.totalCapabilities.toLocaleString()}
                </div>
                <div className="text-label text-brand-gray-04">Capabilities</div>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Error State */}
        {leaderboardError && (
          <GlassPanel className="p-6 text-center">
            <div className="text-headline text-brand-red mb-2">Failed to Load Taxonomy Data</div>
            <p className="text-body text-brand-gray-04 mb-4">
              Unable to fetch the latest model rankings. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="interactive-surface-primary text-on-primary rounded-md py-2 px-4 font-semibold"
            >
              Retry
            </button>
          </GlassPanel>
        )}

        {/* Taxonomy Tree */}
        <GlassPanel className="p-4">
          <div className="mb-4 border-b border-brand-gray-01 pb-3">
            <h2 className="text-body font-semibold text-brand-black mb-1">
              AI Capability Hierarchy
            </h2>
            <p className="text-label text-brand-gray-03">
              Click any capability to view its leaderboard • Click models to view profiles
            </p>
          </div>

          <CapabilitiesTreeView
            nodes={taxonomyTree}
            isLoading={isLoadingLeaderboards}
            onNodeClick={(nodeData) => {
              // Navigate to leaderboard page for this capability
              const nodeId = nodeData.attributes?.id || nodeData.name;
              if (nodeId && nodeId !== "root") {
                window.location.href = `/leaderboard/capability/${nodeId}`;
              }
            }}
          />
        </GlassPanel>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-label text-brand-gray-03">
            Data refreshes every 5 minutes •
            {leaderboardData &&
              ` ${Object.keys(leaderboardData).length}/${TAGS.length} capabilities loaded`}
          </p>
        </div>
      </div>
    </div>
  );
}
