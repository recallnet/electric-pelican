"use client";

import { FilterIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { ElectricButton } from "@/components/ui/electric-button";
import { type LeaderboardFiltersProps } from "@/types/components";

/**
 * Filter controls for the leaderboard including search and minimum matches filter.
 * Provides real-time filtering with debounced search input.
 */
export function LeaderboardFilters({
  searchTerm,
  minMatches,
  onSearchChange,
  onMinMatchesChange,
  isLoading,
}: LeaderboardFiltersProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalSearchTerm("");
    onSearchChange("");
    onMinMatchesChange(0);
  };

  const hasActiveFilters = searchTerm || minMatches > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-03" />
          <input
            type="text"
            placeholder="Search models by name (e.g., gpt-4, claude, gemini)..."
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-brand-gray-02 pl-10 pr-4 py-2 text-body bg-brand-white focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Search models"
          />
        </div>

        {/* Minimum matches filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-brand-gray-03" />
          <label htmlFor="min-matches" className="text-label text-brand-gray-04 whitespace-nowrap">
            Min matches:
          </label>
          <select
            id="min-matches"
            value={minMatches}
            onChange={(e) => onMinMatchesChange(Number(e.target.value))}
            disabled={isLoading}
            className="rounded-md border border-brand-gray-02 px-3 py-2 text-body bg-brand-white focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Minimum matches played filter"
          >
            <option value={0}>All</option>
            <option value={1}>1+</option>
            <option value={5}>5+</option>
            <option value={10}>10+</option>
            <option value={20}>20+</option>
            <option value={50}>50+</option>
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <ElectricButton
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={isLoading}
            aria-label="Clear all filters"
          >
            Clear
          </ElectricButton>
        )}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-label text-brand-gray-04">
          <span>Active filters:</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-md">
              Search: &ldquo;{searchTerm}&rdquo;
            </span>
          )}
          {minMatches > 0 && (
            <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-md">
              Min matches: {minMatches}+
            </span>
          )}
        </div>
      )}
    </div>
  );
}
