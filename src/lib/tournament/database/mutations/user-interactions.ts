/**
 * @file Tournament user interaction mutations
 * @description Write operations for user interactions with tournaments (upvotes, etc.)
 */

import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db, schema } from "../../../../../db";

/**
 * Toggles a user's upvote on a tournament.
 * @description Adds or removes a user's upvote from a tournament.
 *
 * @param tournamentId - ID of the tournament
 * @param userId - ID of the user toggling their upvote
 * @returns Promise resolving to true if upvoted, false if removed
 */
export async function toggleTournamentUpvote(
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  // Check if user has already upvoted this tournament
  const existing = await db
    .select()
    .from(schema.tournamentUpvotes)
    .where(
      and(
        eq(schema.tournamentUpvotes.tournamentId, tournamentId),
        eq(schema.tournamentUpvotes.userId, userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove existing upvote
    await db
      .delete(schema.tournamentUpvotes)
      .where(eq(schema.tournamentUpvotes.id, existing[0]!.id));
    return false;
  } else {
    // Add new upvote
    await db.insert(schema.tournamentUpvotes).values({
      id: uuidv4(),
      tournamentId,
      userId,
      createdAt: new Date(),
    });
    return true;
  }
}
