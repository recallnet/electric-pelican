/**
 * @file Tournament bracket management mutations
 * @description Write operations for managing tournament brackets and runs
 */

import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { ModelResponse, TournamentBracket } from "@/types/tournament";

import { db, schema } from "../../../../../db";

/**
 * Saves a tournament bracket to the database.
 * @description Creates a new tournament run record with bracket data.
 *
 * @param bracket - Tournament bracket data to save
 * @returns Promise resolving to the created run ID
 */
export async function saveTournamentBracket(bracket: TournamentBracket): Promise<string> {
  const runId = uuidv4();
  const now = new Date();

  await db.insert(schema.tournamentRuns).values({
    id: runId,
    tournamentId: bracket.tournamentId,
    version: 1,
    status: bracket.status === "created" ? "running" : bracket.status,
    bracketData: JSON.stringify(bracket),
    startedAt: now,
    completedAt: bracket.status === "completed" ? now : null,
  });

  return runId;
}

/**
 * Updates an existing tournament bracket in the database.
 * @description Updates the existing tournament run with new bracket data.
 *
 * @param bracket - Updated tournament bracket data
 * @throws Error if no tournament run is found to update
 */
export async function updateTournamentBracket(bracket: TournamentBracket): Promise<void> {
  const now = new Date();

  // Find the most recent tournament run to update
  const runs = await db
    .select()
    .from(schema.tournamentRuns)
    .where(eq(schema.tournamentRuns.tournamentId, bracket.tournamentId))
    .orderBy(desc(schema.tournamentRuns.startedAt))
    .limit(1);

  if (runs.length === 0) {
    throw new Error("No tournament run found to update");
  }

  const run = runs[0];
  if (!run) {
    throw new Error("Tournament run data is invalid");
  }

  const runId = run.id;
  const winnerModel =
    bracket.status === "completed"
      ? bracket.matches.find((m) => m.round === bracket.totalRounds)?.winner
      : null;

  await db
    .update(schema.tournamentRuns)
    .set({
      status: bracket.status === "created" ? "running" : bracket.status,
      bracketData: JSON.stringify(bracket),
      winnerModel,
      completedAt: bracket.status === "completed" ? now : null,
    })
    .where(eq(schema.tournamentRuns.id, runId));

  console.log(
    `[tournament-db] Updated tournament ${bracket.tournamentId} with status: ${bracket.status}, winner: ${winnerModel}`,
  );
}

/**
 * Marks a tournament run as completed.
 * @description Updates the tournament run status to completed and sets the winner.
 * Called after streaming execution finishes.
 *
 * @param tournamentRunId - ID of the tournament run to mark as completed
 * @param winnerModel - Optional ID of the winning model
 */
export async function markTournamentRunCompleted(
  tournamentRunId: string,
  winnerModel: string | null = null,
): Promise<void> {
  const now = new Date();

  await db
    .update(schema.tournamentRuns)
    .set({
      status: "completed",
      winnerModel,
      completedAt: now,
    })
    .where(eq(schema.tournamentRuns.id, tournamentRunId));

  console.log(
    `[tournament-db] Tournament run ${tournamentRunId} marked as completed with winner: ${winnerModel}`,
  );
}

/**
 * Updates a tournament with model execution responses.
 * @description Stores model responses in the bracket data and updates the tournament status.
 *
 * @param tournamentId - ID of the tournament to update
 * @param responses - Map of model IDs to their execution responses
 * @throws Error if tournament bracket is not found
 */
export async function updateTournamentWithResponses(
  tournamentId: string,
  responses: Record<string, ModelResponse>,
): Promise<void> {
  const { getTournamentBracket } = await import("../queries");

  const bracket = await getTournamentBracket(tournamentId);
  if (!bracket) {
    throw new Error("Tournament bracket not found");
  }

  // Update bracket with model responses
  const updatedBracket = {
    ...bracket,
    modelResponses: responses,
    status: "models_executed" as const,
  };

  await updateTournamentBracket(updatedBracket);
}
