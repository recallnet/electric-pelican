/**
 * Type definitions for API contracts
 */
import { z } from "zod";

import { ApiRouteKey, ApiRouteSchema } from "@/contracts/api";

/**
 * Extract request schema from API route key
 */
export type RequestSchema<K extends ApiRouteKey> = ApiRouteSchema<K>["request"];

/**
 * Extract params type from API route key
 */
export type ParamsType<K extends ApiRouteKey> =
  RequestSchema<K> extends { params: z.ZodType<unknown> }
    ? z.infer<RequestSchema<K>["params"]>
    : Record<string, never>;

/**
 * Extract body type from API route key
 */
export type BodyType<K extends ApiRouteKey> =
  RequestSchema<K> extends { body: z.ZodType<unknown> }
    ? z.infer<RequestSchema<K>["body"]>
    : undefined;

/**
 * Extract query type from API route key
 */
export type QueryType<K extends ApiRouteKey> =
  RequestSchema<K> extends { query: z.ZodType<unknown> }
    ? z.infer<RequestSchema<K>["query"]>
    : Record<string, never>;

/**
 * Route handler with both params and body
 */
export type RouteHandler<TParams, TBody, TResponse> = (args: {
  params: TParams;
  body: TBody;
}) => Promise<TResponse>;

/**
 * Route handler with only params (no body)
 */
export type RouteHandlerWithoutBody<TParams, TResponse> = (args: {
  params: TParams;
}) => Promise<TResponse>;
