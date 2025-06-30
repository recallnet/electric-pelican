/**
 * @file Leaderboard and ELO-related API contracts.
 * @description API contracts for leaderboard endpoints including global rankings, tag-specific leaderboards, and ELO updates.
 */

import { z } from "zod";

import { hierarchicalTagIdSchema } from "@/types/schemas";

import {
  eloUpdateSchema,
  modelScoreSchema,
  paginationSchema,
  tagLineageSchema,
  taxonomyTagSchema,
} from "./schemas";

/**
 * Leaderboard and ELO-related API contracts.
 * @const
 */
export const leaderboardContracts = {
  // GET /api/leaderboard
  "GET /api/leaderboard": {
    method: "GET" as const,
    path: "/api/leaderboard" as const,
    request: {
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.enum(["globalScore", "winRate", "matchesPlayed"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
        tag: z.string().optional(),
      }),
    },
    response: z.object({
      models: z.array(modelScoreSchema),
      pagination: paginationSchema,
    }),
  },

  // GET /api/leaderboard/:tagId
  "GET /api/leaderboard/:tagId": {
    method: "GET" as const,
    path: "/api/leaderboard/:tagId" as const,
    request: {
      params: z.object({ tagId: hierarchicalTagIdSchema }),
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.enum(["eloScore", "winRate", "matchesPlayed"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
      }),
    },
    response: z.object({
      tag: z.object({
        id: hierarchicalTagIdSchema,
        name: z.string(),
        description: z.string(),
        level: z.number(),
        parentId: hierarchicalTagIdSchema.optional(),
        lineage: tagLineageSchema,
      }),
      models: z.array(
        z.object({
          modelId: z.string(),
          globalScore: z.number(),
          matchesPlayed: z.number(),
          wins: z.number(),
          losses: z.number(),
          winRate: z.number(),
          rank: z.number(),
          lastActive: z.string(),
          modelName: z.string(),
          provider: z.string(),
          change24h: z.number(),
          change7d: z.number(),
        }),
      ),
      pagination: paginationSchema,
      stats: z.object({
        totalModels: z.number(),
        activeLast7Days: z.number(),
        averageElo: z.number(),
        totalMatches: z.number(),
      }),
    }),
  },

  // POST /api/internal/elo/update
  "POST /api/internal/elo/update": {
    method: "POST" as const,
    path: "/api/internal/elo/update" as const,
    request: {
      body: z.object({
        tournamentRunId: z.string(),
        roundNumber: z.number(),
        winnerModelId: z.string(),
        loserModelId: z.string(),
      }),
    },
    response: z.object({
      success: z.boolean(),
      updates: z.array(eloUpdateSchema),
      error: z.string().optional(),
    }),
  },

  // GET /api/tags
  "GET /api/tags": {
    method: "GET" as const,
    path: "/api/tags" as const,
    request: {},
    response: z.object({
      tags: z.array(taxonomyTagSchema),
    }),
  },

  // GET /api/tags/:tagId/stats
  "GET /api/tags/:tagId/stats": {
    method: "GET" as const,
    path: "/api/tags/:tagId/stats" as const,
    request: {
      params: z.object({ tagId: hierarchicalTagIdSchema }),
    },
    response: z.object({
      tag: z.object({
        id: hierarchicalTagIdSchema,
        name: z.string(),
        level: z.number(),
      }),
      stats: z.object({
        totalModels: z.number(),
        totalMatches: z.number(),
        averageElo: z.number(),
        medianElo: z.number(),
        eloRange: z.object({
          min: z.number(),
          max: z.number(),
        }),
        activeLast7Days: z.number(),
        activeLast30Days: z.number(),
        topPerformers: z.array(
          z.object({
            modelId: z.string(),
            eloScore: z.number(),
          }),
        ),
        recentTournaments: z.number(),
        growthStats: z.object({
          newModelsLast7Days: z.number(),
          matchesLast7Days: z.number(),
        }),
      }),
    }),
  },
} as const;
