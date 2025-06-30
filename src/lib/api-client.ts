import { ApiContracts, ApiRouteKey, RouteRequestBody, RouteResponse } from "@/contracts/api";
import type { TypedApiOptions } from "@/types/api-client";

// Re-export for convenience
export type { RouteResponse } from "@/contracts/api";

export async function typedApi<K extends ApiRouteKey>(
  key: K,
  params: ApiRouteKey extends K ? never : Record<string, string | number>,
  body?: RouteRequestBody<K>,
  options: TypedApiOptions = {},
): Promise<RouteResponse<K>> {
  const contract = ApiContracts[key];
  // Build URL (very naive replacement for :slug param)
  let path = contract.path as string;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`:${k}`, encodeURIComponent(String(v)));
    }
  }

  const fetchInit: RequestInit = {
    method: contract.method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };
  if (options.cache) fetchInit.cache = options.cache;
  if (options.signal) fetchInit.signal = options.signal;
  if (contract.method !== "GET" && body) {
    fetchInit.body = JSON.stringify(body);
  }

  const res = await fetch(path, fetchInit);
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: `HTTP ${res.status}` };
    }
    const error = new Error(`API error ${res.status}`) as Error & { status: number; data: unknown };
    error.status = res.status;
    error.data = errorData;
    throw error;
  }
  return (await res.json()) as RouteResponse<K>;
}
