/**
 * @file Tournament creation mutations
 * @description Write operations for creating new tournaments
 */

import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { generatePromptMetadata } from "@/lib/prompt-metadata";
import { CreateTournamentInput } from "@/types/tournament";

import { db, schema } from "../../../../../db";

/** Specifies the runtime environment for database operations */
export const runtime = "nodejs";

/**
 * Creates a new tournament record in the database.
 * @description Creates a tournament with the given configuration and returns its ID.
 * Does NOT kick off execution; the caller may subsequently hit /execute.
 *
 * @param input - Tournament configuration input
 * @param createdBy - User ID of the tournament creator
 * @returns Promise resolving to the created tournament's ID
 * @throws Error if input validation fails
 */
export async function createTournament(
  input: CreateTournamentInput,
  createdBy: string,
): Promise<string> {
  // Basic validation – throw so caller can map to 4xx
  if (!input.prompt || typeof input.prompt !== "string") {
    throw new Error("prompt is required and must be a string");
  }
  if (!Array.isArray(input.models)) {
    throw new Error("models must be an array");
  }
  if (![4, 8, 16].includes(input.bracketSize)) {
    throw new Error("bracketSize must be 4, 8, or 16");
  }
  if (input.models.length !== input.bracketSize) {
    throw new Error("models length must match bracketSize");
  }
  if (!input.judgeModel || typeof input.judgeModel !== "string") {
    throw new Error("judgeModel is required and must be a string");
  }

  const id = uuidv4();
  const now = new Date();

  // Attempt to generate metadata (title + tags) if not provided.
  let generatedTitle: string | undefined;
  let generatedTags: string[] | undefined;
  let generatedTagIds: import("@/types/taxonomy").HierarchicalTagId[] | undefined;

  if (!input.title || !input.tags) {
    try {
      const meta = await generatePromptMetadata(input.prompt, input.judgePrompt);
      if (meta) {
        generatedTitle = meta.title;
        generatedTags = meta.tags;
        generatedTagIds = meta.tagIds;
      }
    } catch {
      // swallow errors – we'll fall back to defaults
    }
  }

  const effectiveTitle = input.title || generatedTitle;
  const effectiveTags = input.tags || generatedTags || [];
  const effectiveTagIds = generatedTagIds || [];

  const slugBase = (effectiveTitle || input.prompt)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const slug = `${slugBase || "tournament"}-${id.slice(0, 8)}`;

  const title = effectiveTitle || `Tournament ${new Date().toLocaleString()}`;

  // Ensure the creating user exists to satisfy FK constraint (especially in dev where
  // Privy user provisioning may not happen before tournament creation).
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.id, createdBy))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.users).values({
      id: createdBy,
      privyId: createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.insert(schema.tournaments).values({
    id,
    slug,
    title,
    prompt: input.prompt,
    judgePrompt: input.judgePrompt ?? "",
    models: JSON.stringify(input.models),
    judgeModel: input.judgeModel,
    bracketSize: input.bracketSize,
    createdBy,
    createdAt: now,
    updatedAt: now,
    forkCount: 0,
    version: 1,
    originalId: id,
    tags: JSON.stringify(effectiveTags),
    // Always store hierarchical tags (Phase 3 complete - feature flag removed)
    tagIds: JSON.stringify(input.tagIds || effectiveTagIds),
  });

  return id;
}
