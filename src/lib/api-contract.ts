import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiContracts, ApiRouteKey, ApiRouteSchema } from "@/contracts/api";
import { BodyType, ParamsType, QueryType, RequestSchema } from "@/types/api-contract";

// Type definitions have been moved to src/types/api-contract.ts

/**
 * Helper to wrap a Next.js route handler with request/response validation based on
 * the contract map. Usage (in a route file):
 *
 * ```ts
 * export const POST = createRoute("POST /api/tournament/:slug/execute", async ({ params, body }) => {
 *   // params & body are typed & already validated
 *   const result = await doStuff(body);
 *   return { success: true, ...result };
 * });
 * ```
 */
export function createRoute<K extends ApiRouteKey>(
  key: K,
  handler: (input: {
    params: ParamsType<K>;
    body: BodyType<K>;
    query: QueryType<K>;
  }) => Promise<z.infer<ApiRouteSchema<K>["response"]>> | z.infer<ApiRouteSchema<K>["response"]>,
) {
  const schema = ApiContracts[key];
  const request = schema.request as RequestSchema<K>;

  const routeHandler = async function route(
    req: Request,
    context: { params: Record<string, string> },
  ) {
    try {
      // Validate params
      const params = "params" in request ? request.params.parse(context.params ?? {}) : {};

      // Validate query
      const url = new URL(req.url);
      const query =
        "query" in request ? request.query.parse(Object.fromEntries(url.searchParams)) : {};

      // Validate body (if present)
      let body: unknown = undefined;
      if (req.method !== "GET" && "body" in request) {
        const rawBody = await req.json();
        body = request.body.parse(rawBody);
      }

      const result = await handler({ params, body, query } as {
        params: ParamsType<K>;
        body: BodyType<K>;
        query: QueryType<K>;
      });
      const responseData = schema.response.parse(result);

      return NextResponse.json(responseData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid request";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  };

  // Cast to route handler type for Next.js
  return routeHandler as (
    req: Request,
    ctx: { params: Record<string, string> },
  ) => Promise<NextResponse>;
}

// These types are now exported from src/types/api-contract.ts
