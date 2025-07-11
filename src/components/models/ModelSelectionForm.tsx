"use client";

import { GlassPanel } from "@/components/ui/glass-panel";

import { BracketSizeSelector } from "./BracketSizeSelector";
import { useModelSelection } from "./hooks/useModelSelection";
import { ModelList } from "./ModelList";
import { SelectedModels } from "./SelectedModels";

export interface ModelSelectionFormProps {
  /** Callback when valid selection is complete */
  onSelectionComplete?: (selection: {
    bracketSize: 4 | 8 | 16;
    contestants: string[];
    judge: string;
  }) => void;
  /** Optional default bracket size */
  defaultBracketSize?: 4 | 8 | 16;
  /** Default contestant model IDs to pre-select */
  defaultContestants?: string[];
  /** Default judge model ID to pre-select */
  defaultJudge?: string;
}

/**
 * Complete model selection form for tournament setup.
 * Fetches models from API, manages selection state, and provides validation.
 */
export function ModelSelectionForm({
  onSelectionComplete,
  defaultBracketSize = 4,
  defaultContestants = [],
  defaultJudge = "",
}: ModelSelectionFormProps) {
  const {
    models,
    loading,
    error,
    bracketSize,
    selectedContestants,
    selectedJudge,
    handleBracketSizeChange,
    handleToggleContestant,
    handleSelectJudge,
    handleRemoveContestant,
    handleRemoveJudge,
    isSelectionComplete,
  } = useModelSelection({
    defaultBracketSize,
    defaultContestants,
    defaultJudge,
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
          <p className="text-label text-brand-gray-03">Loading models...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <GlassPanel className="max-w-md mx-auto p-6">
          <h3 className="text-headline text-brand-red mb-2">Failed to load models</h3>
          <p className="text-body text-brand-red mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red-dark"
          >
            Retry
          </button>
        </GlassPanel>
      </div>
    );
  }

  return (
    <GlassPanel className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-display text-brand-black mb-2">Select Evaluation Models</h1>
        <p className="text-body text-brand-gray-04">
          Choose your bracket size, select contestant models, and pick a judge to evaluate them.
        </p>
      </div>

      {/* Bracket size selector */}
      <BracketSizeSelector
        value={bracketSize}
        onChange={handleBracketSizeChange}
        className="max-w-md mx-auto"
      />

      {/* Selected models summary */}
      <SelectedModels
        allModels={models}
        selectedContestants={selectedContestants}
        selectedJudge={selectedJudge}
        maxContestants={bracketSize}
        onRemoveContestant={handleRemoveContestant}
        onRemoveJudge={handleRemoveJudge}
        {...(isSelectionComplete && onSelectionComplete
          ? {
              onSelectionComplete: () => {
                onSelectionComplete({
                  bracketSize,
                  contestants: selectedContestants,
                  judge: selectedJudge as string,
                });
              },
            }
          : {})}
      />

      {/* Model list */}
      <div>
        <h2 className="text-headline text-brand-black mb-4">Available Models</h2>
        <ModelList
          models={models}
          selectedContestants={selectedContestants}
          selectedJudge={selectedJudge}
          maxContestants={bracketSize}
          onToggleContestant={handleToggleContestant}
          onSelectJudge={handleSelectJudge}
        />
      </div>
    </GlassPanel>
  );
}
