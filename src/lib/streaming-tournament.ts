/**
 * @file Streaming tournament - Re-export from modular structure
 * @description Re-exports streaming tournament functionality from the split modules
 */

// Re-export all core functionality from the modular structure
export * from "./streaming-tournament/core";
export * from "./streaming-tournament/judge-manager";
export * from "./streaming-tournament/timeout-handler";

// Legacy function - kept inline for backward compatibility
import { executeModel } from "@/lib/model-execution";
import { updateTournamentBracket } from "@/lib/tournament-db";
import { StreamingProgress } from "@/types/streaming";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { JudgeMatchup, ModelResponse, TournamentBracket } from "@/types/tournament";

import { executeStreamingTournament } from "./streaming-tournament/core";

/**
 * Legacy function: Execute models with streaming judging
 * @deprecated Use executeStreamingTournament instead
 */
export async function executeModelsWithStreamingJudging(
  models: string[],
  challengePrompt: string,
  bracket: TournamentBracket,
  judgePrompt: string,
  judgeModel: string,
  tournamentRunId?: string,
  tournamentTagIds?: HierarchicalTagId[],
  onProgress?: (progress: StreamingProgress) => void,
): Promise<{
  responses: Record<string, ModelResponse>;
  finalBracket: TournamentBracket;
  allMatches: JudgeMatchup[];
}> {
  console.log(
    "[streaming] Using legacy executeModelsWithStreamingJudging - consider migrating to executeStreamingTournament",
  );

  // Execute models in parallel
  const modelPromises = models.map(async (modelId) => {
    try {
      const response = await executeModel(modelId, challengePrompt);
      return { modelId, response };
    } catch (error) {
      console.error(`[streaming] Model ${modelId} failed:`, error);
      return {
        modelId,
        response: {
          response: "",
          status: "failed" as const,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
      };
    }
  });

  const modelResults = await Promise.all(modelPromises);
  const responses: Record<string, ModelResponse> = {};

  modelResults.forEach(({ modelId, response }) => {
    responses[modelId] = response;
  });

  // Update bracket with responses
  bracket.modelResponses = responses;
  bracket.status = "models_executed";

  // Save bracket to database
  try {
    await updateTournamentBracket(bracket);
  } catch (dbError) {
    console.error("[streaming] Failed to save bracket:", dbError);
  }

  // Use the new streaming tournament execution for judging
  const { finalBracket, allMatches } = await executeStreamingTournament(
    bracket,
    challengePrompt,
    judgePrompt,
    judgeModel,
    models,
    tournamentRunId,
    tournamentTagIds,
    onProgress,
  );

  return {
    responses,
    finalBracket,
    allMatches,
  };
}
