/**
 * @file User-related API contracts.
 * @description API contracts for user endpoints including user listings and profiles.
 */

import { z } from "zod";

/**
 * User-related API contracts.
 * @const
 */
export const userContracts = {
  // GET /api/users/list
  "GET /api/users/list": {
    method: "GET" as const,
    path: "/api/users/list" as const,
    request: {},
    response: z.object({
      users: z.array(
        z.object({
          id: z.string(),
          displayName: z.string(),
          avatarUrl: z.string().nullable(),
          evaluationsCreated: z.number(),
          topTags: z.array(z.string()),
          createdAt: z.string(),
        }),
      ),
    }),
  },
} as const;
