"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GlassPanel } from "@/components/ui/glass-panel";
import { DEFAULT_JUDGE_MODEL_DATA } from "@/config/defaults";
import { typedApi } from "@/lib/api-client";
import { useDevLogger } from "@/lib/dev-logger";
import { ProcessedModel } from "@/types/models";

import { BracketSizeSelector } from "./BracketSizeSelector";
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
  const logUI = useDevLogger("ModelSelectionForm");

  // State management
  const [models, setModels] = useState<ProcessedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16>(defaultBracketSize);
  const [selectedContestants, setSelectedContestants] = useState<string[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);

  // Track if we've applied initial selection to prevent re-application
  const hasAppliedInitialSelection = useRef(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await typedApi("GET /api/models", {}, undefined, {
          cache: "no-cache",
        });

        if (!data.models) {
          throw new Error("No models returned from API");
        }

        // Ensure the default judge model is in the list with full data
        const defaultJudgeModel = DEFAULT_JUDGE_MODEL_DATA as ProcessedModel;
        const fetchedModelIds = data.models.map((m: ProcessedModel) => m.id);
        const allModels = !fetchedModelIds.includes(defaultJudgeModel.id)
          ? [defaultJudgeModel, ...data.models]
          : data.models;

        setModels(allModels);

        // Apply initial random selection once
        if (!hasAppliedInitialSelection.current) {
          // Set default judge first
          const judgeId = defaultJudge || defaultJudgeModel.id;
          setSelectedJudge(judgeId);

          // Select 4 random models from different providers for contestants
          const availableForContestants = allModels.filter((m) => m.id !== judgeId);

          // Group models by provider
          const modelsByProvider = new Map<string, ProcessedModel[]>();
          availableForContestants.forEach((model) => {
            if (model.provider) {
              const providerModels = modelsByProvider.get(model.provider) || [];
              providerModels.push(model);
              modelsByProvider.set(model.provider, providerModels);
            }
          });

          // Get list of providers
          const providers = Array.from(modelsByProvider.keys());

          if (providers.length > 0) {
            // Shuffle providers
            const shuffledProviders = [...providers].sort(() => Math.random() - 0.5);

            // Select up to 4 providers
            const selectedProviders = shuffledProviders.slice(0, Math.min(4, providers.length));

            // Pick one random model from each provider
            let newContestants: string[] = [];
            selectedProviders.forEach((provider) => {
              const providerModels = modelsByProvider.get(provider);
              if (providerModels && providerModels.length > 0) {
                const randomIndex = Math.floor(Math.random() * providerModels.length);
                const modelId = providerModels[randomIndex]?.id;
                if (modelId) {
                  newContestants.push(modelId);
                }
              }
            });

            // If we didn't get 4 models, fill the rest randomly without provider constraint
            if (
              newContestants.length < 4 &&
              availableForContestants.length > newContestants.length
            ) {
              const remainingModels = availableForContestants.filter(
                (m) => !newContestants.includes(m.id || "") && m.id,
              );
              const needed = 4 - newContestants.length;
              const additional = remainingModels
                .sort(() => Math.random() - 0.5)
                .slice(0, needed)
                .map((m) => m.id)
                .filter((id): id is string => Boolean(id));
              newContestants = [...newContestants, ...additional];
            }

            // Use default contestants if provided, otherwise use random selection
            const initialContestants =
              defaultContestants.length > 0
                ? defaultContestants.slice(0, 4)
                : newContestants.slice(0, 4);
            setSelectedContestants(initialContestants);
            logUI("initial_selection", {
              count: initialContestants.length,
              providers: selectedProviders,
              judge: judgeId,
              isDefault: defaultContestants.length > 0,
            });
          }

          hasAppliedInitialSelection.current = true;
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load models. Please try refreshing the page.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [defaultJudge, logUI]); // Removed defaultContestants to prevent infinite loop with empty arrays

  // Handle bracket size change
  const handleBracketSizeChange = useCallback(
    (newSize: 4 | 8 | 16) => {
      setBracketSize(newSize);
      // Trim contestants if needed
      if (selectedContestants.length > newSize) {
        setSelectedContestants((prev) => prev.slice(0, newSize));
        logUI("trim_contestants", { from: selectedContestants.length, to: newSize });
      }
    },
    [selectedContestants.length, logUI],
  );

  // Handle contestant selection
  const handleToggleContestant = useCallback(
    (modelId: string) => {
      const isCurrentlySelected = selectedContestants.includes(modelId);

      if (isCurrentlySelected) {
        setSelectedContestants((prev) => prev.filter((id) => id !== modelId));
        logUI("remove_contestant", { modelId });
      } else if (selectedContestants.length < bracketSize) {
        setSelectedContestants((prev) => [...prev, modelId]);
        logUI("add_contestant", { modelId });

        // Remove from judge if currently selected as judge
        if (selectedJudge === modelId) {
          setSelectedJudge(null);
          logUI("remove_contestant_from_judge", { modelId });
        }
      }
    },
    [selectedContestants, bracketSize, selectedJudge, logUI],
  );

  // Handle judge selection
  const handleSelectJudge = useCallback(
    (modelId: string) => {
      if (selectedJudge === modelId) {
        // If clicking on the currently selected judge, remove them
        setSelectedJudge(null);
        logUI("remove_judge", { modelId });
      } else {
        // Otherwise, set this model as the new judge
        setSelectedJudge(modelId);
        logUI("select_judge", { modelId, action: "select" });

        // Remove from contestants if selecting as judge
        if (selectedContestants.includes(modelId)) {
          setSelectedContestants((prev) => prev.filter((id) => id !== modelId));
          logUI("remove_judge_from_contestants", { modelId });
        }
      }
    },
    [selectedContestants, selectedJudge, logUI],
  );

  // Handle removing contestant
  const handleRemoveContestant = useCallback(
    (modelId: string) => {
      setSelectedContestants((prev) => prev.filter((id) => id !== modelId));
      logUI("remove_contestant", { modelId });
    },
    [logUI],
  );

  // Handle removing judge
  const handleRemoveJudge = useCallback(() => {
    setSelectedJudge(null);
    logUI("remove_judge");
  }, [logUI]);

  // Check if selection is complete and valid
  const isSelectionComplete = selectedContestants.length === bracketSize && selectedJudge !== null;

  // NO AUTO-SUBMIT: Removed the useEffect that automatically called onSelectionComplete
  // Users must now manually click the "Start Eval" button

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
