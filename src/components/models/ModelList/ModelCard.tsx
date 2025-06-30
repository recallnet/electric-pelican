"use client";

import { ModelLink } from "@/components/leaderboard/ModelLink";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { type ModelCardProps } from "@/types/components";

/**
 * Mobile card component for model display
 */
export function ModelCard({
  model,
  rating,
  isContestant,
  isJudge,
  canAddContestant,
  onToggleContestant,
  onSelectJudge,
}: ModelCardProps) {
  return (
    <GlassPanel intensity="light" className="p-4">
      {/* Header: Model Name + New Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ModelLink modelId={model.id} className="font-medium text-sm" />
            {model.isNew && (
              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-brand-gray-04">{model.provider}</p>
        </div>
      </div>

      {/* Content: Rating + Context */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-brand-gray-04 mb-1">Rating</p>
          <p className="text-sm font-medium">
            {rating ? Math.round(rating.globalScore) : "Unrated"}
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-gray-04 mb-1">Context</p>
          <p className="text-sm font-medium">
            {model.context_length?.toLocaleString() || "Unknown"} tokens
          </p>
        </div>
      </div>

      {/* Actions: Contestant + Judge buttons */}
      <div className="flex gap-2">
        <Button
          variant={isContestant ? "default" : canAddContestant ? "outline" : "ghost"}
          onClick={() => onToggleContestant(model.id)}
          disabled={!isContestant && !canAddContestant}
          className="flex-1 text-sm h-11"
        >
          {isContestant ? "Remove" : "Add"}
        </Button>
        <Button
          variant={isJudge ? "default" : "outline"}
          onClick={() => onSelectJudge(model.id)}
          className="flex-1 text-sm h-11"
        >
          {isJudge ? "Remove Judge" : "Set Judge"}
        </Button>
      </div>
    </GlassPanel>
  );
}
