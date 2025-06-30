/**
 * @file Base schemas for API contracts.
 * @description Common Zod schemas used across multiple API endpoints.
 */

import { z } from "zod";

import { hierarchicalTagIdSchema } from "@/types/schemas";

/**
 * Zod schema for model score validation.
 * @const
 */
export const modelScoreSchema = z.object({
  modelId: z.string(),
  globalScore: z.number(),
  matchesPlayed: z.number(),
  wins: z.number(),
  losses: z.number(),
  winRate: z.number(),
  rank: z.number(),
  lastActive: z.string(),
});

/**
 * Zod schema for match result validation.
 * @const
 */
export const matchResultSchema = z.object({
  tournamentRunId: z.string(),
  roundNumber: z.number(),
  winnerModelId: z.string(),
  loserModelId: z.string(),
  winnerScoreBefore: z.number(),
  loserScoreBefore: z.number(),
  winnerScoreAfter: z.number(),
  loserScoreAfter: z.number(),
  resultType: z.enum(["judged", "forfeit", "random_advance"]).optional(),
  createdAt: z.string(),
});

/**
 * Zod schema for ELO update validation.
 * @const
 */
export const eloUpdateSchema = z.object({
  modelId: z.string(),
  oldScore: z.number(),
  newScore: z.number(),
  change: z.number(),
});

/**
 * Zod schema for taxonomy tag validation.
 * @const
 */
export const taxonomyTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parentId: z.string().optional(),
});

/**
 * Common pagination schema.
 * @const
 */
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

/**
 * Common query parameters for pagination.
 * @const
 */
export const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * Common success response schema.
 * @const
 */
export const successResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Challenge Generator API schema.
 * @description Schema for validating challenge generator responses.
 * @const
 */
export const challengeGeneratorResponseSchema = z.object({
  challenge: z.string().describe("The generated challenge prompt"),
});

/**
 * Tag lineage schema for hierarchical tags.
 * @const
 */
export const tagLineageSchema = z.array(
  z.object({
    id: hierarchicalTagIdSchema,
    name: z.string(),
  }),
);

/**
 * Evaluation result schema.
 * @const
 */
export const evaluationResultSchema = z.object({
  tournamentId: z.string(),
  title: z.string(),
  prompt: z.string(),
  result: z.enum(["win", "loss", "ongoing"]),
  opponent: z.string().optional(),
  createdAt: z.string(),
  tagIds: z.array(hierarchicalTagIdSchema).optional(),
  tags: z.array(z.string()).optional(),
});
