import { z } from "zod";

import {
  ForkSchema,
  TournamentRunSchema,
  TournamentSchema,
  UserSchema,
} from "@/schemas/tournament";

/**
 * Zod schemas for our core types
 */

/**
 * Type definitions for DTO objects from Zod schemas
 */
export type UserDTO = z.infer<typeof UserSchema>;
export type TournamentDTO = z.infer<typeof TournamentSchema>;
export type TournamentRunDTO = z.infer<typeof TournamentRunSchema>;
export type ForkDTO = z.infer<typeof ForkSchema>;

export const modelResponseSchema = z.object({
  response: z.string(),
  status: z.enum(["success", "failed"]),
  error: z.string().optional(),
  timestamp: z.number(),
});

export const bracketMatchSchema = z.object({
  id: z.string(),
  round: z.number(),
  position: z.number(),
  modelA: z.string().nullable(),
  modelB: z.string().nullable(),
  winner: z.string().nullable(),
  judgeExplanation: z.string().optional(),
});

export const tournamentBracketSchema = z.object({
  tournamentId: z.string(),
  bracketSize: z.number(),
  totalRounds: z.number(),
  matches: z.array(bracketMatchSchema),
  status: z.enum(["created", "running", "completed", "models_executed"]),
  currentRound: z.number(),
  modelResponses: z.record(z.string(), modelResponseSchema).optional(),
});

export const tournamentPhaseSchema = z.enum([
  "setup",
  "executing_models",
  "judging",
  "completed",
  "failed",
]);

/**
 * Hierarchical tag ID schema - will be populated with actual leaf IDs at runtime
 * For now, we use a string schema that can be refined later with the actual enum
 */
export const hierarchicalTagIdSchema = z.string();

export const tournamentSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
  phase: tournamentPhaseSchema,
  currentRound: z.number(),
  totalRounds: z.number(),
  progress: z.number(),
  winner: z.string().optional(),
  bracketSize: z.number(),
  matches: z.array(bracketMatchSchema),
  modelResponses: z.record(z.string(), modelResponseSchema).optional(),
  prompt: z.string().optional(),
  judgePrompt: z.string().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  authorName: z.string().optional(),
  authorId: z.string().optional(),
  upvoteCount: z.number().optional(),
  hasUpvoted: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  forkCount: z.number().optional(),
  // Hierarchical tagging system
  tagIds: z.array(hierarchicalTagIdSchema).optional(), // NEW: structured capability tags
  tags: z.array(z.string()).optional(), // LEGACY: free-text tags for backward compatibility
  models: z.array(z.string()).optional(),
  judgeModel: z.string().optional(),
});
