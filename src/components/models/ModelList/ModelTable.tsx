"use client";

import { ModelLink } from "@/components/leaderboard/ModelLink";
import { Button } from "@/components/ui/button";
import { ModelRating, ProcessedModel } from "@/types/models";

interface ModelTableProps {
  sortedModels: ProcessedModel[];
  modelRatings: Map<string, ModelRating>;
  selectedContestants: string[];
  selectedJudge: string | null;
  maxContestants: number;
  onToggleContestant: (modelId: string) => void;
  onSelectJudge: (modelId: string) => void;
  sortBy: "name" | "rating" | "context" | "default";
  sortOrder: "asc" | "desc";
  onSort: (field: "name" | "rating" | "context") => void;
}

/**
 * Desktop table view for model list
 */
export function ModelTable({
  sortedModels,
  modelRatings,
  selectedContestants,
  selectedJudge,
  maxContestants,
  onToggleContestant,
  onSelectJudge,
  sortBy,
  sortOrder,
  onSort,
}: ModelTableProps) {
  return (
    <div className="hidden sm:block" data-testid="desktop-table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pl-4 pr-2 font-medium text-gray-500">
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  Model
                  {sortBy === "name" && (
                    <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-2 px-2 font-medium text-gray-500">
                <button
                  onClick={() => onSort("rating")}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  Rating
                  {sortBy === "rating" && (
                    <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-2 px-2 font-medium text-gray-500">
                <button
                  onClick={() => onSort("context")}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  Context
                  {sortBy === "context" && (
                    <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="text-right py-2 pl-2 pr-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedModels.map((model) => {
              const rating = modelRatings.get(model.id);
              const isContestant = selectedContestants.includes(model.id);
              const isJudge = selectedJudge === model.id;
              const canAddContestant = !isContestant && selectedContestants.length < maxContestants;

              return (
                <tr key={model.id} className="hover:bg-gray-50">
                  <td className="py-2 pl-4 pr-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          <ModelLink modelId={model.id} />
                        </div>
                        <div className="text-gray-500">{model.provider}</div>
                      </div>
                      {model.isNew && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    {rating ? (
                      <div className="text-gray-900">{Math.round(rating.globalScore)}</div>
                    ) : (
                      <div className="text-gray-400">Unrated</div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-gray-900">
                      {model.context_length.toLocaleString()} tokens
                    </div>
                  </td>
                  <td className="py-2 pl-2 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={isContestant ? "default" : canAddContestant ? "outline" : "ghost"}
                        onClick={() => onToggleContestant(model.id)}
                        disabled={!isContestant && !canAddContestant}
                        className="whitespace-nowrap"
                      >
                        {isContestant ? "Remove" : "Add"}
                      </Button>
                      <Button
                        variant={isJudge ? "default" : "outline"}
                        onClick={() => onSelectJudge(model.id)}
                        className="whitespace-nowrap"
                      >
                        {isJudge ? "Remove Judge" : "Set Judge"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
