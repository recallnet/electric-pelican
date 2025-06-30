/**
 * @file Model-related API contracts.
 * @description API contracts for model endpoints including model listing, statistics, and evaluations.
 */

import { z } from "zod";

import type { ProcessedModel } from "@/types/models";
import { hierarchicalTagIdSchema } from "@/types/schemas";

import {
  evaluationResultSchema,
  matchResultSchema,
  modelScoreSchema,
  paginationQuerySchema,
  paginationSchema,
} from "./schemas";

/**
 * Model-related API contracts.
 * @const
 */
export const modelContracts = {
  // GET /api/models
  "GET /api/models": {
    method: "GET" as const,
    path: "/api/models" as const,
    request: {
      query: z.object({
        limit: z.string().optional(),
        capability: z.enum(["text", "images", "all"]).optional(),
        q: z.string().optional(),
        tag: z.string().optional(),
      }),
    },
    response: z.object({
      models: z.array(z.custom<ProcessedModel>()),
      cached: z.boolean(),
      timestamp: z.string(),
    }),
  },

  // GET /api/models/:id/stats
  "GET /api/models/:id/stats": {
    method: "GET" as const,
    path: "/api/models/:id/stats" as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    response: z.object({
      modelScore: modelScoreSchema,
      recentMatches: z.array(matchResultSchema),
      eloHistory: z.array(
        z.object({
          date: z.string(),
          score: z.number(),
          change: z.number(),
        }),
      ),
    }),
  },

  // GET /api/models/:id/evaluations
  "GET /api/models/:id/evaluations": {
    method: "GET" as const,
    path: "/api/models/:id/evaluations" as const,
    request: {
      params: z.object({ id: z.string() }),
      query: paginationQuerySchema,
    },
    response: z.object({
      evaluations: z.array(evaluationResultSchema),
      pagination: paginationSchema,
    }),
  },

  // GET /api/models/:id/tag-performance
  "GET /api/models/:id/tag-performance": {
    method: "GET" as const,
    path: "/api/models/:id/tag-performance" as const,
    request: {
      params: z.object({ id: z.string() }),
    },
    response: z.object({
      tags: z.array(
        z.object({
          tag: z.string(),
          percentile: z.number(),
          wins: z.number(),
          total: z.number(),
        }),
      ),
    }),
  },

  // GET /api/models/:id/tag-scores
  "GET /api/models/:id/tag-scores": {
    method: "GET" as const,
    path: "/api/models/:id/tag-scores" as const,
    request: {
      params: z.object({ id: z.string() }),
      query: z.object({
        level: z.string().optional(),
        minMatches: z.string().optional(),
      }),
    },
    response: z.object({
      modelId: z.string(),
      modelName: z.string(),
      provider: z.string(),
      tagScores: z.array(
        z.object({
          modelId: z.string(),
          tagId: hierarchicalTagIdSchema,
          tagName: z.string(),
          tagLevel: z.number(),
          parentTagId: hierarchicalTagIdSchema.optional(),
          eloScore: z.number(),
          matchesPlayed: z.number(),
          wins: z.number(),
          losses: z.number(),
          winRate: z.number(),
          rank: z.number(),
          totalModelsForTag: z.number(),
          percentile: z.number(),
          lastActive: z.string(),
        }),
      ),
      summary: z.object({
        totalTags: z.number(),
        strongestTag: z
          .object({
            tagId: hierarchicalTagIdSchema,
            tagName: z.string(),
            eloScore: z.number(),
            percentile: z.number(),
          })
          .nullable(),
        weakestTag: z
          .object({
            tagId: hierarchicalTagIdSchema,
            tagName: z.string(),
            eloScore: z.number(),
            percentile: z.number(),
          })
          .nullable(),
        averageElo: z.number(),
        totalMatches: z.number(),
      }),
    }),
  },
} as const;
