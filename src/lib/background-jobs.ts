import { and, eq, lt } from "drizzle-orm";

import { TournamentWithMetadata } from "@/types/tournament-jobs";

import { db } from "../../db";
import * as schema from "../../db/schema";
import {
  getCompleteTournamentData,
  getTournamentBracket,
  updateTournamentBracket,
} from "./tournament-db";
import { runTournamentJudging } from "./tournament-judging";

export const runtime = "nodejs";

/**
 * Background job processor to handle stuck tournaments.
 * Retries tournaments that are stuck in intermediate states due to server restarts.
 */
export class TournamentJobProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly maxRetries = 2;
  private readonly retryIntervalMs = 30_000; // 30 seconds
  private readonly stuckTimeoutMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Start the background job processor.
   */
  start(): void {
    if (this.isRunning) {
      console.log("[jobs] Background job processor already running");
      return;
    }

    this.isRunning = true;
    console.log("[jobs] Starting background job processor");

    // Run immediately, then every 30 seconds
    this.processStuckTournaments();
    this.intervalId = setInterval(() => {
      this.processStuckTournaments();
    }, this.retryIntervalMs);
  }

  /**
   * Stop the background job processor.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[jobs] Stopped background job processor");
  }

  /**
   * Process tournaments that are stuck in intermediate states.
   */
  private async processStuckTournaments(): Promise<void> {
    try {
      const stuckCutoff = new Date(Date.now() - this.stuckTimeoutMs);

      // Find tournament runs that are stuck in "models_executed" state
      // and haven't been updated recently (likely due to server restart)
      // EXCLUDE runs that are already completed or failed
      const stuckRuns = await db
        .select({
          id: schema.tournamentRuns.id,
          tournamentId: schema.tournamentRuns.tournamentId,
          bracketData: schema.tournamentRuns.bracketData,
          startedAt: schema.tournamentRuns.startedAt,
          status: schema.tournamentRuns.status,
        })
        .from(schema.tournamentRuns)
        .innerJoin(
          schema.tournaments,
          eq(schema.tournaments.id, schema.tournamentRuns.tournamentId),
        )
        .where(
          and(
            eq(schema.tournamentRuns.status, "models_executed"),
            lt(schema.tournamentRuns.startedAt, stuckCutoff),
          ),
        );

      if (stuckRuns.length === 0) {
        return;
      }

      console.log(`[jobs] Found ${stuckRuns.length} stuck tournament(s), processing...`);

      for (const run of stuckRuns) {
        // Double-check the bracket status before processing
        try {
          const bracket = JSON.parse(run.bracketData as string);
          if (bracket.status === "completed") {
            console.log(
              `[jobs] Tournament ${run.tournamentId} bracket is already completed, updating database status`,
            );
            await this.markAsCompleted(run.id, bracket);
            continue;
          }
        } catch (error) {
          console.error(`[jobs] Error parsing bracket data for ${run.tournamentId}:`, error);
        }

        await this.retryTournamentJudging(run.tournamentId, run.id);
      }
    } catch (error) {
      console.error("[jobs] Error processing stuck tournaments:", error);
    }
  }

  /**
   * Retry judging for a specific tournament.
   */
  private async retryTournamentJudging(tournamentId: string, runId: string): Promise<void> {
    try {
      // Check retry count
      const retryCount = await this.getRetryCount(runId);
      if (retryCount >= this.maxRetries) {
        console.log(
          `[jobs] Tournament ${tournamentId} has exceeded max retries (${this.maxRetries}), skipping`,
        );
        await this.markAsFailed(runId, "Max retries exceeded");
        return;
      }

      console.log(
        `[jobs] Retrying judging for tournament ${tournamentId} (attempt ${retryCount + 1}/${this.maxRetries})`,
      );

      // Fetch tournament data
      const tournamentData = await getCompleteTournamentData(tournamentId);
      if (!tournamentData || !tournamentData.tournament) {
        throw new Error(`Tournament ${tournamentId} not found`);
      }
      const tournament = tournamentData.tournament as unknown as TournamentWithMetadata; // Tournament with metadata

      // Get bracket data
      const bracket = await getTournamentBracket(tournamentId);
      if (!bracket || !bracket.modelResponses) {
        console.error(`[jobs] Tournament ${tournamentId} has no bracket or model responses`);
        return;
      }

      // Increment retry count
      await this.incrementRetryCount(runId);

      // Use default judge prompt if none provided
      const judgePrompt =
        tournament.judgePrompt ||
        "Compare these two responses and determine which one better answers the challenge prompt. Consider accuracy, completeness, clarity, and helpfulness.";

      // Run tournament judging with ELO updates
      const { finalBracket } = await runTournamentJudging(
        bracket,
        tournament.prompt,
        judgePrompt,
        tournament.judgeModel,
        runId, // Pass tournament run ID for ELO updates
      );

      // Update bracket with results
      await updateTournamentBracket(finalBracket);

      console.log(`[jobs] Successfully completed judging for tournament ${tournamentId}`);
    } catch (error) {
      console.error(`[jobs] Failed to retry tournament ${tournamentId}:`, error);

      // Increment retry count even on failure
      await this.incrementRetryCount(runId);

      // Check if we should mark as failed
      const retryCount = await this.getRetryCount(runId);
      if (retryCount >= this.maxRetries) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await this.markAsFailed(runId, `Failed after ${this.maxRetries} retries: ${errorMessage}`);
      }
    }
  }

  /**
   * Get the current retry count for a tournament run.
   */
  private async getRetryCount(runId: string): Promise<number> {
    try {
      const result = await db
        .select({ retryCount: schema.tournamentRuns.retryCount })
        .from(schema.tournamentRuns)
        .where(eq(schema.tournamentRuns.id, runId))
        .limit(1);

      return result[0]?.retryCount || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Increment the retry count for a tournament run.
   */
  private async incrementRetryCount(runId: string): Promise<void> {
    try {
      const currentCount = await this.getRetryCount(runId);
      await db
        .update(schema.tournamentRuns)
        .set({ retryCount: currentCount + 1 })
        .where(eq(schema.tournamentRuns.id, runId));
    } catch (error) {
      console.error(`[jobs] Failed to increment retry count for run ${runId}:`, error);
    }
  }

  /**
   * Mark a tournament run as failed.
   */
  private async markAsFailed(runId: string, reason: string): Promise<void> {
    try {
      await db
        .update(schema.tournamentRuns)
        .set({
          status: "failed",
          completedAt: new Date(),
          failureReason: reason,
        })
        .where(eq(schema.tournamentRuns.id, runId));

      console.log(`[jobs] Marked tournament run ${runId} as failed: ${reason}`);
    } catch (error) {
      console.error(`[jobs] Failed to mark run ${runId} as failed:`, error);
    }
  }

  /**
   * Mark a tournament run as completed.
   */
  private async markAsCompleted(runId: string, bracket: any): Promise<void> {
    try {
      await db
        .update(schema.tournamentRuns)
        .set({
          status: "completed",
          completedAt: new Date(),
          bracketData: JSON.stringify(bracket),
        })
        .where(eq(schema.tournamentRuns.id, runId));

      console.log(`[jobs] Marked tournament run ${runId} as completed`);
    } catch (error) {
      console.error(`[jobs] Failed to mark run ${runId} as completed:`, error);
    }
  }
}

// Global instance
let globalProcessor: TournamentJobProcessor | null = null;

/**
 * Start the global background job processor.
 */
export function startBackgroundJobs(): void {
  if (globalProcessor) {
    return;
  }

  globalProcessor = new TournamentJobProcessor();
  globalProcessor.start();
}

/**
 * Stop the global background job processor.
 */
export function stopBackgroundJobs(): void {
  if (globalProcessor) {
    globalProcessor.stop();
    globalProcessor = null;
  }
}
