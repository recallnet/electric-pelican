/**
 * API testing utilities and response validation helpers
 */

export interface ApiTestResponse {
  status: number;
  headers: Headers;
  json: () => Promise<any>;
  ok: boolean;
}

export function createMockResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {},
): ApiTestResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({
      "content-type": "application/json",
      ...headers,
    }),
    json: () => Promise.resolve(data),
  };
}

export function setupApiMocks() {
  // Setup global fetch mock if not already done
  if (!global.fetch) {
    global.fetch = jest.fn() as jest.Mock;
  }
}

export function mockApiResponse(url: string, response: ApiTestResponse) {
  (global.fetch as jest.Mock).mockImplementation((requestUrl: string) => {
    if (requestUrl.includes(url)) {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unmocked API call: ${requestUrl}`));
  });
}

// Validation helpers
export function validateTaxonomyResponse(data: any) {
  expect(data).toHaveProperty("success");
  expect(data).toHaveProperty("taxonomyData");
  expect(data).toHaveProperty("overallStats");
  expect(data).toHaveProperty("meta");

  // Validate overallStats structure
  expect(data.overallStats).toHaveProperty("totalModels");
  expect(data.overallStats).toHaveProperty("totalCapabilities");
  expect(data.overallStats).toHaveProperty("totalMatches");
  expect(typeof data.overallStats.totalModels).toBe("number");
  expect(typeof data.overallStats.totalCapabilities).toBe("number");
  expect(typeof data.overallStats.totalMatches).toBe("number");

  // Validate meta structure
  expect(data.meta).toHaveProperty("queryTimeMs");
  expect(data.meta).toHaveProperty("capabilitiesReturned");
  expect(typeof data.meta.queryTimeMs).toBe("number");
  expect(typeof data.meta.capabilitiesReturned).toBe("number");

  // Validate taxonomyData structure
  expect(typeof data.taxonomyData).toBe("object");
}

/**
 * Create mock taxonomy response data that matches the actual API structure
 */
export function createMockTaxonomyData() {
  return {
    success: true,
    taxonomyData: {
      "scene-understanding": {
        success: true,
        models: [
          {
            modelId: "anthropic/claude-3-sonnet",
            modelName: "Claude 3 Sonnet",
            provider: "anthropic",
            eloScore: 1450,
            globalScore: 1450,
            matchesPlayed: 42,
            winRate: 0.714,
            rank: 1,
          },
        ],
        stats: {
          totalModels: 127,
          totalMatches: 1250,
          averageElo: 1205,
        },
      },
      "logical-reasoning": {
        success: true,
        models: [
          {
            modelId: "openai/gpt-4",
            modelName: "GPT-4",
            provider: "openai",
            eloScore: 1425,
            globalScore: 1425,
            matchesPlayed: 38,
            winRate: 0.684,
            rank: 1,
          },
        ],
        stats: {
          totalModels: 134,
          totalMatches: 1180,
          averageElo: 1198,
        },
      },
    },
    overallStats: {
      totalModels: 151,
      totalCapabilities: 2,
      totalMatches: 2430,
    },
    meta: {
      queryTimeMs: 45,
      capabilitiesReturned: 2,
      cacheHint: "max-age=300",
    },
  };
}
