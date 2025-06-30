/**
 * @file Core streaming tournament execution logic
 * @description Main streaming tournament orchestration that prioritizes judging over model execution
 */

import { executeModel } from "@/lib/model-execution";
import { updateTournamentBracket } from "@/lib/tournament-db";
import { StreamingProgress, StreamingTournamentState } from "@/types/streaming";
import type { HierarchicalTagId } from "@/types/taxonomy";
import { JudgeMatchup, TournamentBracket } from "@/types/tournament";

import { checkAndJudgeReadyMatches } from "./judge-manager";

// Timeout constants
export const TOURNAMENT_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes for entire tournament
export const MATCH_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes per match

/**
 * Execute tournament with streaming judging - judge matches as soon as models are ready.
 * This provides much better UX by showing progress immediately instead of waiting.
 */
export async function executeStreamingTournament(
  bracket: TournamentBracket,
  challengePrompt: string,
  judgePrompt: string,
  judgeModel: string,
  models: string[],
  tournamentRunId?: string,
  tournamentTagIds?: HierarchicalTagId[],
  onProgress?: (progress: StreamingProgress) => void,
): Promise<{ finalBracket: TournamentBracket; allMatches: JudgeMatchup[] }> {
  console.log(`[streaming] Starting streaming tournament execution for ${bracket.tournamentId}`);
  console.log(`[streaming] Models: ${models.length}, Rounds: ${bracket.totalRounds}`);
  console.log(
    `[streaming] Timeout limits: Tournament=${Math.round(TOURNAMENT_TIMEOUT_MS / 1000)}s, Match=${Math.round(MATCH_TIMEOUT_MS / 1000)}s`,
  );

  const state: StreamingTournamentState = {
    bracket: { ...bracket },
    modelResponses: {},
    pendingModels: new Set(models),
    completedModels: new Set(),
    readyMatches: [],
    judgedMatches: new Set(),
    judgingMatches: new Set(),
    isComplete: false,
    currentRound: 1,
    tournamentStartTime: Date.now(),
    matchStartTimes: new Map(),
    stuckMatches: new Set(),
  };

  const allMatches: JudgeMatchup[] = [];

  // Start all models executing in parallel
  const modelPromises = models.map(async (modelId) => {
    try {
      console.log(`[streaming] Starting execution of ${modelId}`);
      const response = await executeModel(modelId, challengePrompt);

      // Model completed - update state and check for ready matches
      state.modelResponses[modelId] = response;
      state.pendingModels.delete(modelId);
      state.completedModels.add(modelId);

      console.log(`[streaming] ✅ ${modelId} completed (${response.status})`);

      // Notify progress
      onProgress?.({
        type: "model_completed",
        modelId,
        totalModelsCompleted: state.completedModels.size,
        totalModelsRunning: state.pendingModels.size,
        totalMatchesJudged: state.judgedMatches.size,
        totalMatchesReady: state.readyMatches.length,
        currentRound: state.currentRound,
        tournamentStatus: state.pendingModels.size > 0 ? "models_executing" : "judging",
      });

      // Check for newly ready matches and judge them immediately
      await checkAndJudgeReadyMatches(
        state,
        challengePrompt,
        judgePrompt,
        judgeModel,
        tournamentRunId,
        tournamentTagIds,
        onProgress,
        allMatches,
      );

      return { modelId, response };
    } catch (error) {
      console.error(`[streaming] ❌ ${modelId} failed:`, error);

      // Even failed models should be marked as completed
      state.modelResponses[modelId] = {
        response: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      };
      state.pendingModels.delete(modelId);
      state.completedModels.add(modelId);

      onProgress?.({
        type: "model_completed",
        modelId,
        totalModelsCompleted: state.completedModels.size,
        totalModelsRunning: state.pendingModels.size,
        totalMatchesJudged: state.judgedMatches.size,
        totalMatchesReady: state.readyMatches.length,
        currentRound: state.currentRound,
        tournamentStatus: state.pendingModels.size > 0 ? "models_executing" : "judging",
      });

      // Check for ready matches even with failed models
      await checkAndJudgeReadyMatches(
        state,
        challengePrompt,
        judgePrompt,
        judgeModel,
        tournamentRunId,
        tournamentTagIds,
        onProgress,
        allMatches,
      );

      return { modelId, response: state.modelResponses[modelId] };
    }
  });

  // Wait for all models to complete
  await Promise.all(modelPromises);

  // Update bracket with all model responses
  state.bracket.modelResponses = state.modelResponses;

  // Save bracket with model responses to database
  try {
    await updateTournamentBracket(state.bracket);
  } catch (dbError) {
    console.error(`[streaming] Failed to save bracket with model responses:`, dbError);
  }

  // Final check for any remaining matches that need judging
  await checkAndJudgeReadyMatches(
    state,
    challengePrompt,
    judgePrompt,
    judgeModel,
    tournamentRunId,
    tournamentTagIds,
    onProgress,
    allMatches,
  );

  console.log(`[streaming] Tournament execution completed`);
  console.log(`[streaming] Total matches judged: ${allMatches.length}`);
  console.log(`[streaming] Stuck matches resolved: ${state.stuckMatches.size}`);
  console.log(
    `[streaming] Total execution time: ${Math.round((Date.now() - state.tournamentStartTime) / 1000)}s`,
  );

  // Clean up any remaining match timers
  state.matchStartTimes.clear();

  // Note: tournament_completed event is emitted in judge-manager when final round completes

  return {
    finalBracket: state.bracket,
    allMatches,
  };
}
