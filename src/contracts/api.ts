/**
 * @file API contract definitions.
 * @description Contains type definitions and Zod schemas for all API endpoints,
 * including request/response shapes and validation rules.
 */

import { z } from "zod";

import { leaderboardContracts } from "./leaderboards";
import { modelContracts } from "./models";
import { tournamentContracts } from "./tournaments";
import { userContracts } from "./users";

// Re-export all base schemas for convenience
export * from "./schemas";

/**
 * Contract map for all REST endpoints.
 * @description Defines request and response Zod schemas for each endpoint,
 * enabling both TypeScript type inference and runtime validation.
 * @const
 */
export const ApiContracts = {
  ...modelContracts,
  ...tournamentContracts,
  ...leaderboardContracts,
  ...userContracts,
} as const;

/**
 * Type of the complete API contract map.
 * @type
 */
export type ApiContractMap = typeof ApiContracts;

/**
 * Valid API route keys.
 * @type
 */
export type ApiRouteKey = keyof ApiContractMap;

/**
 * Schema for a specific API route.
 * @type
 */
export type ApiRouteSchema<K extends ApiRouteKey> = ApiContractMap[K];

/**
 * Request body type for a specific API route.
 * @type
 */
export type RouteRequestBody<K extends ApiRouteKey> = K extends keyof ApiContractMap
  ? ApiContractMap[K]["request"] extends {
      body: infer B extends z.ZodType<any, any, any>;
    }
    ? z.infer<B>
    : undefined
  : never;

/**
 * Response type for a specific API route.
 * @type
 */
export type RouteResponse<K extends ApiRouteKey> =
  ApiContractMap[K]["response"] extends z.ZodSchema<infer T> ? T : any;
