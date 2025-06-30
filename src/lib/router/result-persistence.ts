import { eq, inArray } from "drizzle-orm";

import type { CompletedExecutionState } from "@/types/router-execution";
import type {
  GetExecutionResponse,
  ModelEloData,
  ModelEloScore,
  RouterExecutionResult,
  SaveExecutionResponse,
  TagEloScore,
} from "@/types/router-results";

import { db } from "../../../db";
import { models, modelTagScores, routerExecutionResults } from "../../../db/schema";
import { getExecutionState } from "./execution-state";

/**
 * Captures ELO data for the specific models used in the router execution.
 */
async function captureModelEloData(modelIds: string[]): Promise<ModelEloData> {
  console.log(`Capturing ELO data for models: ${modelIds.join(", ")}`);
  const startTime = Date.now();

  try {
    // Get model data and global ELO scores
    const modelData = await db
      .select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        globalScore: models.eloScore,
        matchesPlayed: models.matchesPlayed,
        wins: models.wins,
        losses: models.losses,
      })
      .from(models)
      .where(inArray(models.id, modelIds));

    const modelScores: Record<string, ModelEloScore> = {};
    modelData.forEach((model) => {
      modelScores[model.id] = {
        modelId: model.id,
        name: model.name,
        provider: model.provider,
        globalScore: model.globalScore,
        matchesPlayed: model.matchesPlayed,
        wins: model.wins,
        losses: model.losses,
      };
    });

    // Get tag-specific ELO scores for these models
    const tagData = await db
      .select({
        modelId: modelTagScores.modelId,
        tagId: modelTagScores.tagId,
        eloScore: modelTagScores.eloScore,
        matchesPlayed: modelTagScores.matchesPlayed,
        wins: modelTagScores.wins,
        losses: modelTagScores.losses,
      })
      .from(modelTagScores)
      .where(inArray(modelTagScores.modelId, modelIds));

    const tagScores: Record<string, Record<string, TagEloScore>> = {};
    tagData.forEach((score) => {
      if (!tagScores[score.modelId]) {
        tagScores[score.modelId] = {};
      }
      tagScores[score.modelId]![score.tagId] = {
        modelId: score.modelId,
        tagId: score.tagId,
        eloScore: score.eloScore,
        matchesPlayed: score.matchesPlayed,
        wins: score.wins,
        losses: score.losses,
      };
    });

    const eloData: ModelEloData = {
      capturedAt: new Date(),
      models: modelScores,
      tagScores,
    };

    const duration = Date.now() - startTime;
    console.log(`ELO data captured in ${duration}ms for ${Object.keys(modelScores).length} models`);

    return eloData;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`ELO data capture failed in ${duration}ms:`, error);
    throw new Error(
      `Failed to capture ELO data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract model IDs from execution state
 */
function extractModelIds(executionState: CompletedExecutionState): string[] {
  const modelIds = new Set<string>();

  // Add single model recommendation
  if (executionState.singleModelRecommendation?.modelId) {
    modelIds.add(executionState.singleModelRecommendation.modelId);
  }

  // Add workflow models
  if (executionState.optimizedWorkflow) {
    executionState.optimizedWorkflow.forEach((step: { selectedModel?: { id?: string } }) => {
      if (step.selectedModel?.id) {
        modelIds.add(step.selectedModel.id);
      }
    });
  }

  // Add models from actual execution results
  if (executionState.singleResult?.modelId) {
    modelIds.add(executionState.singleResult.modelId);
  }
  if (executionState.workflowResult?.modelId) {
    modelIds.add(executionState.workflowResult.modelId);
  }

  return Array.from(modelIds);
}

/**
 * Transform database result to API format
 */
function transformDbResultToApi(
  dbResult: typeof routerExecutionResults.$inferSelect,
): RouterExecutionResult {
  return dbResult as unknown as RouterExecutionResult;
}

export async function saveExecutionResult(
  executionId: string,
  userId?: string,
): Promise<SaveExecutionResponse> {
  console.log(`Saving execution result for: ${executionId}`);
  const startTime = Date.now();

  try {
    // Get execution state - cast to our extended type
    const executionState = getExecutionState(
      executionId,
    ) as unknown as CompletedExecutionState | null;
    if (!executionState) {
      throw new Error(`Execution state not found for ID: ${executionId}`);
    }

    // Validate execution is complete
    if (!executionState.isComplete) {
      throw new Error(`Execution ${executionId} is not complete`);
    }

    // Extract model IDs and capture ELO data
    const modelIdArray = extractModelIds(executionState);
    console.log(`Capturing ELO data for ${modelIdArray.length} models used in execution`);
    const modelEloData = await captureModelEloData(modelIdArray);

    // Generate result ID and share token
    const resultId = generateResultId();
    const shareToken = generateShareToken();

    // Prepare result data
    const resultData: typeof routerExecutionResults.$inferInsert = {
      id: resultId,
      executionId,
      originalPrompt: executionState.originalPrompt,
      completedAt: new Date(),
      analysisResult: executionState.analysisResult,
      singleModelRecommendation: executionState.singleModelRecommendation,
      optimizedWorkflow: executionState.optimizedWorkflow,
      singleResult: executionState.singleResult,
      workflowResult: executionState.workflowResult,
      intermediateResults: executionState.intermediateResults,
      comparisonData: executionState.comparisonData,
      modelEloData,
      totalExecutionTime: executionState.totalExecutionTime || 0,
      routerVersion: process.env.ROUTER_VERSION || "1.0.0",
      userId,
      isPublic: true,
      shareToken,
    };

    // Insert into database
    await db.insert(routerExecutionResults).values(resultData);

    const duration = Date.now() - startTime;
    console.log(`Execution result saved in ${duration}ms: ${resultId}`);

    return {
      success: true,
      data: {
        resultId,
        shareUrl: `/router/${resultId}`,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Failed to save execution result in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      data: {
        resultId: "",
        shareUrl: "",
      },
      error: "Failed to save execution result",
      message: errorMessage,
    };
  }
}

export async function getExecutionResult(resultId: string): Promise<GetExecutionResponse> {
  console.log(`Fetching execution result: ${resultId}`);
  const startTime = Date.now();

  try {
    const result = await db
      .select()
      .from(routerExecutionResults)
      .where(eq(routerExecutionResults.id, resultId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        data: null,
        error: "Result not found",
      };
    }

    const dbResult = result[0]!;
    const routerResult = transformDbResultToApi(dbResult);

    const duration = Date.now() - startTime;
    console.log(`Execution result fetched in ${duration}ms: ${resultId}`);

    return {
      success: true,
      data: routerResult,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Failed to fetch execution result in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      data: null,
      error: "Failed to fetch execution result",
      message: errorMessage,
    };
  }
}

// Utility functions
function generateResultId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `result_${timestamp}_${random}`;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
