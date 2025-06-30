"use client";

import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProcessedModel } from "@/types/models";

export interface ModelCardProps {
  /** Model data to display */
  model: ProcessedModel;
  /** Whether this model is selected as a contestant */
  isSelectedContestant: boolean;
  /** Whether this model is selected as judge */
  isSelectedJudge: boolean;
  /** Whether selection is disabled (e.g., max contestants reached) */
  disabled?: boolean;
  /** Callback when model is selected/deselected as contestant */
  onToggleContestant: (modelId: string) => void;
  /** Callback when model is selected as judge */
  onSelectJudge: (modelId: string) => void;
}

/**
 * Individual model card with selection controls.
 * Displays model metadata, badges, and allows selection as contestant or judge.
 */
export function ModelCard({
  model,
  isSelectedContestant,
  isSelectedJudge,
  disabled = false,
  onToggleContestant,
  onSelectJudge,
}: ModelCardProps) {
  const isSelected = isSelectedContestant || isSelectedJudge;
  const canSelectContestant = !disabled && !isSelectedJudge;
  const canSelectJudge = !isSelectedContestant;

  return (
    <div
      className={`
        relative rounded-lg border p-4 transition-all duration-200
        ${isSelected ? "border-brand-blue bg-brand-blue/5" : "border-brand-gray-02 hover:border-brand-gray-03"}
        ${disabled && !isSelected ? "opacity-50" : ""}
      `}
      role="article"
      aria-label={`Model: ${model.name}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-brand-white">
            <CheckIcon className="h-4 w-4" />
            <span className="sr-only">
              {isSelectedContestant ? "Selected as contestant" : "Selected as judge"}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-brand-black truncate">{model.name}</h3>
            <p className="text-label text-brand-gray-04">{model.provider}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {model.isNew && (
              <Badge variant="secondary" className="bg-brand-green/10 text-brand-green">
                NEW
              </Badge>
            )}
            {model.rank <= 10 && (
              <Badge variant="outline" className="text-label">
                #{model.rank}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {model.description && (
          <p className="text-label text-brand-gray-04 line-clamp-2">{model.description}</p>
        )}

        {/* Model details */}
        <div className="flex flex-wrap gap-4 text-label text-brand-gray-04">
          {model.context_length > 0 && (
            <span>Context: {model.context_length.toLocaleString()}</span>
          )}
          {model.tokens_served > 0 && <span>Tokens: {model.tokens_served.toLocaleString()}</span>}
          {model.capabilities.length > 0 && (
            <span>Capabilities: {model.capabilities.join(", ")}</span>
          )}
        </div>

        {/* Selection buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant={isSelectedContestant ? "default" : "outline"}
            disabled={!canSelectContestant}
            onClick={() => onToggleContestant(model.id)}
            aria-label={`${isSelectedContestant ? "Remove from" : "Add to"} contestants`}
            className="w-full text-xs overflow-hidden"
          >
            <span className="truncate">{isSelectedContestant ? "Remove" : "Add"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isSelectedJudge ? "default" : "outline"}
            disabled={!canSelectJudge}
            onClick={() => onSelectJudge(model.id)}
            aria-label={`${isSelectedJudge ? "Remove as" : "Select as"} judge`}
            className="w-full text-xs overflow-hidden"
          >
            <span className="truncate">{isSelectedJudge ? "Remove" : "Judge"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
