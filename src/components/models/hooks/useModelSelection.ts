"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_JUDGE_MODEL_DATA } from "@/config/defaults";
import { typedApi } from "@/lib/api-client";
import { useDevLogger } from "@/lib/dev-logger";
import type { UseModelSelectionProps, UseModelSelectionReturn } from "@/types/hooks";
import { ProcessedModel } from "@/types/models";

/**
 * Hook to manage model selection state and logic
 */
export function useModelSelection({
  defaultBracketSize = 4,
  defaultContestants = [],
  defaultJudge = "",
}: UseModelSelectionProps): UseModelSelectionReturn {
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

          // Select random models from different providers for contestants (respecting bracket size)
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

            // Select up to bracket size providers (or as many as available)
            const selectedProviders = shuffledProviders.slice(
              0,
              Math.min(bracketSize, providers.length),
            );

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

            // If we didn't get enough models, fill the rest randomly without provider constraint
            if (
              newContestants.length < bracketSize &&
              availableForContestants.length > newContestants.length
            ) {
              const remainingModels = availableForContestants.filter(
                (m) => !newContestants.includes(m.id || "") && m.id,
              );
              const needed = bracketSize - newContestants.length;
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
                ? defaultContestants.slice(0, bracketSize)
                : newContestants.slice(0, bracketSize);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return {
    // State
    models,
    loading,
    error,
    bracketSize,
    selectedContestants,
    selectedJudge,

    // Actions
    handleBracketSizeChange,
    handleToggleContestant,
    handleSelectJudge,
    handleRemoveContestant,
    handleRemoveJudge,

    // Computed
    isSelectionComplete,
  };
}
