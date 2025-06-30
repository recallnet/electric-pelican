"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import { ModelScore } from "@/types/api-models";

import { ModelLink } from "./ModelLink";
import { ModelRankBadge } from "./ModelRankBadge";
import { PaginationControls } from "./PaginationControls";
import { SortButton } from "./SortButton";
import { WinRateIndicator } from "./WinRateIndicator";

export interface LeaderboardTableProps {
  models: ModelScore[];
  sortBy: "globalScore" | "winRate" | "matchesPlayed";
  order: "asc" | "desc";
  onSort: (sortBy: "globalScore" | "winRate" | "matchesPlayed") => void;
  isLoading: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

/**
 * Main leaderboard table component with responsive design and sorting.
 * Displays model rankings with ELO scores, win rates, and match statistics.
 */
export function LeaderboardTable({
  models,
  sortBy,
  order,
  onSort,
  isLoading,
  pagination,
  onPageChange,
}: LeaderboardTableProps) {
  // Helper functions (currently unused but kept for future features)
  // const getModelDisplayName = (modelId: string) => {
  //   return modelId.split('/').pop() || modelId;
  // };

  // const getOpenRouterUrl = (modelId: string) => {
  //   return `https://openrouter.ai/models/${modelId}`;
  // };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <GlassPanel className="overflow-hidden">
      <div className="animate-pulse">
        {/* Desktop table skeleton */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gray-02">
                {["Rank", "Model", "ELO Score", "Matches", "Win Rate"].map((header) => (
                  <th key={header} className="text-left py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-brand-gray-01">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-8"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-32"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-16"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-12"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-brand-gray-02 rounded w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card skeleton */}
        <div className="sm:hidden space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glassmorphism-25 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 bg-brand-gray-02 rounded w-8"></div>
                <div className="h-4 bg-brand-gray-02 rounded w-16"></div>
              </div>
              <div className="h-4 bg-brand-gray-02 rounded w-40 mb-2"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-brand-gray-02 rounded w-20"></div>
                <div className="h-4 bg-brand-gray-02 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );

  // Empty state
  if (!isLoading && models.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-headline text-brand-black mb-4">No Models Found</h3>
        <p className="text-body text-brand-gray-04 mb-6">
          No models match your current filters. Try adjusting your search criteria.
        </p>
      </GlassPanel>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <GlassPanel className="overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gray-02">
                <th className="text-left py-3 px-4 font-medium text-brand-black w-20">Rank</th>
                <th className="text-left py-3 px-4 font-medium text-brand-black">
                  <SortButton
                    label="Model"
                    sortKey="globalScore" // Models are sorted by score primarily
                    currentSort={sortBy}
                    currentOrder={order}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-brand-black w-32">
                  <SortButton
                    label="ELO Score"
                    sortKey="globalScore"
                    currentSort={sortBy}
                    currentOrder={order}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-brand-black w-24">
                  <SortButton
                    label="Matches"
                    sortKey="matchesPlayed"
                    currentSort={sortBy}
                    currentOrder={order}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-brand-black w-32">
                  <SortButton
                    label="Win Rate"
                    sortKey="winRate"
                    currentSort={sortBy}
                    currentOrder={order}
                    onSort={onSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr
                  key={model.modelId}
                  className="border-b border-brand-gray-01 hover:bg-brand-gray-01/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <ModelRankBadge rank={model.rank} />
                  </td>
                  <td className="py-3 px-4">
                    <ModelLink modelId={model.modelId} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-headline text-brand-black font-semibold">
                      {model.globalScore.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-body text-brand-gray-04">{model.matchesPlayed}</div>
                  </td>
                  <td className="py-3 px-4">
                    <WinRateIndicator
                      winRate={model.winRate}
                      wins={model.wins}
                      losses={model.losses}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4 p-4">
          {models.map((model) => (
            <div
              key={model.modelId}
              className="glassmorphism-25 backdrop-blur-sm border border-white/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <ModelRankBadge rank={model.rank} />
                <div className="text-headline text-brand-black font-semibold">
                  {model.globalScore.toLocaleString()}
                </div>
              </div>

              <div className="mb-3">
                <ModelLink modelId={model.modelId} />
              </div>

              <div className="flex justify-between items-center text-label">
                <div className="text-brand-gray-04">{model.matchesPlayed} matches</div>
                <WinRateIndicator winRate={model.winRate} wins={model.wins} losses={model.losses} />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
