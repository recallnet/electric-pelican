"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { useModelSearch } from "@/hooks/useModelSearch";
import { ModelRating, ProcessedModel } from "@/types/models";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useModelListData(initialModels: ProcessedModel[]) {
  // State for search and filters
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "rating" | "context" | "default">("default");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { searchQuery, setSearchQuery, models } = useModelSearch({
    initialModels,
    debounceMs: 300,
  });

  // Fetch model ratings
  const { data: ratingsData } = useSWR<{ models: ModelRating[] }>("/api/leaderboard", fetcher);
  const modelRatings = useMemo(() => {
    if (!ratingsData?.models) return new Map<string, ModelRating>();
    return new Map(ratingsData.models.map((m: ModelRating) => [m.modelId, m]));
  }, [ratingsData]);

  // Handle sorting
  const handleSort = (field: "name" | "rating" | "context") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort models
  const sortedModels = useMemo(() => {
    let result = models;

    if (showNewOnly) {
      result = result.filter((m) => m.isNew);
    }

    if (showTopOnly) {
      const ratings = Array.from(modelRatings.values());
      const top10Ids = new Set(
        ratings
          .sort((a, b) => b.globalScore - a.globalScore)
          .slice(0, 10)
          .map((m) => m.modelId),
      );
      result = result.filter((m) => top10Ids.has(m.id));
    }

    // Sort based on selected criteria
    return result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "default": {
          // Special default sorting: Unranked-New first, then by rank descending
          const ratingA = modelRatings.get(a.id);
          const ratingB = modelRatings.get(b.id);

          // Both unrated - prioritize new models
          if (!ratingA && !ratingB) {
            if (a.isNew && !b.isNew) return -1;
            if (!a.isNew && b.isNew) return 1;
            return a.id.localeCompare(b.id); // Alphabetical for same category
          }

          // One unrated - unrated comes first if it's new
          if (!ratingA && ratingB) return a.isNew ? -1 : 1;
          if (ratingA && !ratingB) return b.isNew ? 1 : -1;

          // Both rated - sort by rank (lower rank = better = comes first)
          return (ratingA?.rank || Infinity) - (ratingB?.rank || Infinity);
        }
        case "name": {
          comparison = a.id.localeCompare(b.id);
          break;
        }
        case "rating": {
          const ratingA = modelRatings.get(a.id)?.globalScore || 0;
          const ratingB = modelRatings.get(b.id)?.globalScore || 0;
          comparison = ratingB - ratingA; // Default to desc for rating
          break;
        }
        case "context": {
          const contextA = a.context_length || 0;
          const contextB = b.context_length || 0;
          comparison = contextB - contextA; // Default to desc for context
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [models, showNewOnly, showTopOnly, modelRatings, sortBy, sortOrder]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    showNewOnly,
    setShowNewOnly,
    showTopOnly,
    setShowTopOnly,
    sortBy,
    sortOrder,

    // Data
    sortedModels,
    modelRatings,

    // Actions
    handleSort,
  };
}
