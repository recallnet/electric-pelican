"use client";

import { FilterIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProcessedModel } from "@/types/models";

import { ModelCard } from "./ModelCard";
import { ModelTable } from "./ModelTable";
import { useModelListData } from "./useModelListData";

export interface ModelListProps {
  /** Array of models to display */
  models: ProcessedModel[];
  /** IDs of selected contestant models */
  selectedContestants: string[];
  /** ID of selected judge model */
  selectedJudge: string | null;
  /** Maximum number of contestants allowed */
  maxContestants: number;
  /** Callback when contestant is toggled */
  onToggleContestant: (modelId: string) => void;
  /** Callback when judge is selected */
  onSelectJudge: (modelId: string) => void;
  /** Optional callback when selection is complete */
  onSelectionComplete?: () => void;
}

/**
 * Complete model list with search, filtering, and selection controls.
 * Shows model metadata and allows selection as contestant or judge.
 */
export function ModelList({
  models: initialModels,
  selectedContestants,
  selectedJudge,
  maxContestants,
  onToggleContestant,
  onSelectJudge,
}: ModelListProps) {
  const {
    searchQuery,
    setSearchQuery,
    showNewOnly,
    setShowNewOnly,
    showTopOnly,
    setShowTopOnly,
    sortBy,
    sortOrder,
    sortedModels,
    modelRatings,
    handleSort,
  } = useModelListData(initialModels);

  return (
    <div className="space-y-4">
      {/* Search and filters - works on both mobile and desktop */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={showNewOnly ? "default" : "outline"}
            onClick={() => setShowNewOnly(!showNewOnly)}
            className="whitespace-nowrap"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            New Models
          </Button>
          <Button
            variant={showTopOnly ? "default" : "outline"}
            onClick={() => setShowTopOnly(!showTopOnly)}
            className="whitespace-nowrap"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Top Rated
          </Button>
        </div>
      </div>

      {/* Desktop Table */}
      <ModelTable
        sortedModels={sortedModels}
        modelRatings={modelRatings}
        selectedContestants={selectedContestants}
        selectedJudge={selectedJudge}
        maxContestants={maxContestants}
        onToggleContestant={onToggleContestant}
        onSelectJudge={onSelectJudge}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3" data-testid="mobile-cards">
        {sortedModels.map((model) => {
          const rating = modelRatings.get(model.id);
          const isContestant = selectedContestants.includes(model.id);
          const isJudge = selectedJudge === model.id;
          const canAddContestant = !isContestant && selectedContestants.length < maxContestants;

          return (
            <ModelCard
              key={model.id}
              model={model}
              rating={rating}
              isContestant={isContestant}
              isJudge={isJudge}
              canAddContestant={canAddContestant}
              onToggleContestant={onToggleContestant}
              onSelectJudge={onSelectJudge}
            />
          );
        })}
      </div>
    </div>
  );
}
