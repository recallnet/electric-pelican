"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardStats } from "@/components/leaderboard/LeaderboardStats";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ElectricButton } from "@/components/ui/electric-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ModelScore } from "@/types/api-models";

// Simple fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.status}`);
  }
  return response.json();
};

export default function LeaderboardPage() {
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"globalScore" | "winRate" | "matchesPlayed">("globalScore");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [minMatches, setMinMatches] = useState(0);

  // Fetch leaderboard data
  const { data, error, isLoading, mutate } = useSWR(
    `/api/leaderboard?page=${page}&sortBy=${sortBy}&order=${order}&limit=50`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    },
  );

  // Filter models by search term and minimum matches
  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    let filtered = data.models;

    // Filter by search term (model ID contains search term)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((model: ModelScore) => model.modelId.toLowerCase().includes(term));
    }

    // Filter by minimum matches played
    if (minMatches > 0) {
      filtered = filtered.filter((model: ModelScore) => model.matchesPlayed >= minMatches);
    }

    return filtered;
  }, [data?.models, searchTerm, minMatches]);

  // Handle sort changes
  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setOrder("desc");
    }
    setPage(1); // Reset to first page when sorting changes
  };

  // Handle search changes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle minimum matches filter
  const handleMinMatchesChange = (matches: number) => {
    setMinMatches(matches);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8 items-center justify-center">
        <GlassPanel className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-headline text-brand-red mb-4">Error Loading Leaderboard</h1>
          <p className="text-body text-brand-gray-04 mb-6">
            Failed to load the model leaderboard. Please try again.
          </p>
          <ElectricButton onClick={() => mutate()} className="w-full sm:w-auto">
            Retry
          </ElectricButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-display text-brand-black mb-2">Model Leaderboard</h1>
          <p className="text-body text-brand-gray-04">
            AI model rankings based on head-to-head evaluation performance
          </p>
        </div>

        {/* Stats Overview */}
        <LeaderboardStats
          totalModels={data?.pagination.total || 0}
          totalMatches={0}
          averageScore={1200}
          isLoading={isLoading}
        />

        {/* Filters */}
        <LeaderboardFilters
          searchTerm={searchTerm}
          minMatches={minMatches}
          onSearchChange={handleSearch}
          onMinMatchesChange={handleMinMatchesChange}
          isLoading={isLoading}
        />

        {/* Main Content */}
        <div className="flex-grow">
          <LeaderboardTable
            models={filteredModels}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-label text-brand-gray-03">
            Rankings are updated in real-time based on evaluation results
          </p>
        </div>
      </div>
    </div>
  );
}
