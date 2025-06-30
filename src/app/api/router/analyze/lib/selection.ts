/**
 * @file Model selection and workflow assignment logic
 * @description Handles model selection for capabilities and workflow step assignment
 */

import { getTagLeaderboard } from "@/lib/elo";
import { getTagLineage } from "@/lib/tag-taxonomy";
import type { HierarchicalTagId } from "@/types/taxonomy";

import {
  getBaseUrl,
  getCapabilityDisplayName,
  getModelDisplayName,
  getModelProvider,
} from "./utils";

/**
 * Assign models to workflow steps using hierarchical ELO lookup
 */
export async function assignModelsToWorkflow(
  workflow: Array<{
    id: string;
    description: string;
    primaryCapability: HierarchicalTagId;
    estimatedTokens: number;
    dependencies: string[];
  }>,
): Promise<
  Array<{
    id: string;
    description: string;
    primaryCapability: HierarchicalTagId;
    capabilityName: string;
    estimatedTokens: number;
    selectedModel: {
      modelId: string;
      modelName: string;
      provider: string;
      eloScore: number;
      reasoning: string;
      // Capability used for model selection
      selectedForCapability: HierarchicalTagId;
      selectedForCapabilityName: string;
    };
    dependencies: string[];
  }>
> {
  const workflowWithModels = [];

  for (const step of workflow) {
    const selectedModel = await selectModelForCapability(step.primaryCapability);
    const capabilityName = getCapabilityDisplayName(step.primaryCapability);

    workflowWithModels.push({
      ...step,
      capabilityName,
      selectedModel: {
        modelId: selectedModel.modelId,
        modelName: selectedModel.modelName,
        provider: selectedModel.provider,
        eloScore: selectedModel.eloScore,
        reasoning: selectedModel.reasoning,
        selectedForCapability: selectedModel.selectedForCapability,
        selectedForCapabilityName: selectedModel.selectedForCapabilityName,
      },
    });
  }

  return workflowWithModels;
}

/**
 * Select the best model for a specific capability using direct database lookup
 */
export async function selectModelForCapability(capability: HierarchicalTagId): Promise<{
  modelId: string;
  modelName: string;
  provider: string;
  eloScore: number;
  reasoning: string;
  selectedForCapability: HierarchicalTagId;
  selectedForCapabilityName: string;
}> {
  try {
    // First try direct lookup for the specific capability using database function
    console.log(`[router] Looking up ELO data for capability: ${capability}`);

    const directData = await getTagLeaderboard(capability, { limit: 1 });
    console.log(`[router] Direct ELO lookup result:`, {
      hasModels: directData.models.length > 0,
      firstModel: directData.models[0]?.modelId || "none",
      firstModelScore: directData.models[0]?.eloScore || "none",
    });

    if (directData.models && directData.models.length > 0) {
      const topModel = directData.models[0];
      if (topModel) {
        console.log(
          `[router] ✅ Using real ELO data for ${capability}: ${topModel.modelId} (${topModel.eloScore})`,
        );
        return {
          modelId: topModel.modelId,
          modelName: getModelDisplayName(topModel.modelId),
          provider: getModelProvider(topModel.modelId),
          eloScore: topModel.eloScore,
          reasoning: `Top performer for ${capability} (${topModel.matchesPlayed} matches, ${Math.round(topModel.winRate * 100)}% win rate)`,
          selectedForCapability: capability,
          selectedForCapabilityName: getCapabilityDisplayName(capability),
        };
      }
    } else {
      console.log(`[router] ❌ No models in direct ELO lookup for ${capability}`);
    }

    // Hierarchical fallback: Try each parent capability until we find one with data
    const lineage = getTagLineage(capability);
    console.log(
      `[router] Trying hierarchical fallback for ${capability}, lineage:`,
      lineage.map((t) => t.id),
    );

    // Start from the parent (second to last) and work up to the root
    for (let i = lineage.length - 2; i >= 0; i--) {
      const parentCapability = lineage[i];
      if (!parentCapability) continue;

      const parentUrl = `${getBaseUrl()}/api/leaderboard/${parentCapability.id}`;
      console.log(`[router] Fetching parent ELO data from: ${parentUrl} (level ${i + 1})`);

      try {
        const parentResponse = await fetch(parentUrl);
        console.log(
          `[router] Parent ELO lookup response: ${parentResponse.status} ${parentResponse.statusText}`,
        );

        if (parentResponse.ok) {
          const parentData = await parentResponse.json();
          console.log(`[router] Parent ELO data:`, {
            hasModels: !!parentData.models,
            modelsLength: parentData.models?.length || 0,
            firstModel: parentData.models?.[0]?.modelName || "none",
            firstModelScore: parentData.models?.[0]?.globalScore || "none",
          });

          if (parentData.models && parentData.models.length > 0) {
            const topModel = parentData.models[0];
            console.log(
              `[router] Using hierarchical fallback data for ${capability}: ${topModel.modelName} (${topModel.globalScore}) from ${parentCapability.name}`,
            );
            return {
              modelId: topModel.modelId,
              modelName: topModel.modelName,
              provider: topModel.provider,
              eloScore: topModel.globalScore, // Use globalScore from the API
              reasoning: `Top performer for ${parentCapability.name} (hierarchical fallback from ${capability})`,
              selectedForCapability: capability,
              selectedForCapabilityName: getCapabilityDisplayName(capability),
            };
          }
        } else {
          const errorText = await parentResponse.text();
          console.log(
            `[router] Parent ELO lookup failed for ${parentCapability.name}: ${errorText}`,
          );
        }
      } catch (error) {
        console.log(`[router] Error fetching parent capability ${parentCapability.name}:`, error);
        continue; // Try the next parent up the hierarchy
      }
    }

    // Final fallback: Use a reliable general model
    console.log(
      `[router] No ELO data found in entire hierarchy for ${capability}, using fallback model`,
    );
    return {
      modelId: "anthropic/claude-3-5-sonnet-20241022",
      modelName: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      eloScore: 1400,
      reasoning: `Fallback model for ${capability} (no ELO data available in hierarchy)`,
      selectedForCapability: capability,
      selectedForCapabilityName: getCapabilityDisplayName(capability),
    };
  } catch (error) {
    console.error(`[router] Model selection failed for ${capability}:`, error);
    return {
      modelId: "anthropic/claude-3-5-sonnet-20241022",
      modelName: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      eloScore: 1400,
      reasoning: `Error fallback for ${capability}: ${error}`,
      selectedForCapability: capability,
      selectedForCapabilityName: getCapabilityDisplayName(capability),
    };
  }
}

/**
 * Select single best model for the entire prompt
 */
export async function selectSingleModel(dominantCapability: HierarchicalTagId): Promise<{
  modelId: string;
  modelName: string;
  provider: string;
  eloScore: number;
  reasoning: string;
  dominantCapability: HierarchicalTagId;
}> {
  const model = await selectModelForCapability(dominantCapability);

  return {
    modelId: model.modelId,
    modelName: model.modelName,
    provider: model.provider,
    eloScore: model.eloScore,
    reasoning: `Best overall model based on dominant capability: ${dominantCapability}`,
    dominantCapability,
  };
}
