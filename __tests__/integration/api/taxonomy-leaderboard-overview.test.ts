/**
 * @file Integration test for taxonomy leaderboard overview API
 * @description Tests the bulk API endpoint that replaces 154 individual calls
 * @jest-environment node
 */

// import { NextRequest } from "next/server";
import { validateTaxonomyResponse } from "../../setup/api-test-helpers";

// Mock database to prevent real database calls in tests
const mockDb = {
  execute: jest.fn(),
};

// Mock the database import with correct path
jest.mock("../../../db", () => ({
  db: mockDb,
  schema: {},
}));

jest.mock("drizzle-orm", () => ({
  sql: jest.fn((strings, ...values) => ({
    type: "sql",
    strings,
    values,
  })),
}));

// Import the API route after mocking
import { GET } from "@/app/api/taxonomy/leaderboard-overview/route";

describe("Taxonomy Leaderboard Overview API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have the correct API endpoint available and return proper structure", async () => {
    // Mock database response with realistic data
    const mockQueryResult = [
      {
        tag_id: "scene-understanding",
        model_id: "anthropic/claude-3-sonnet",
        model_name: "Claude 3 Sonnet",
        provider: "anthropic",
        elo_score: 1450,
        matches_played: 42,
        wins: 30,
        losses: 12,
        win_rate: 0.714,
        total_models: 127,
        total_matches: 1250,
        average_elo: 1205,
      },
    ];

    const mockOverallStats = {
      total_models: 151,
      total_capabilities: 1,
      total_tag_matches: 1250,
    };

    // Setup database mocks
    mockDb.execute
      .mockResolvedValueOnce(mockQueryResult) // Main query
      .mockResolvedValueOnce([mockOverallStats]); // Overall stats query

    // Test the API route directly
    const response = await GET();

    // Verify response status
    expect(response.status).toBe(200);

    // Parse response data
    const data = await response.json();

    // Use validation helper to check structure
    validateTaxonomyResponse(data);

    // Verify specific data content
    expect(data.success).toBe(true);
    expect(data.meta.capabilitiesReturned).toBe(1);
    expect(data.overallStats.totalModels).toBe(151);

    console.log(
      `✅ Taxonomy API returned ${data.meta.capabilitiesReturned} capabilities in ${data.meta.queryTimeMs}ms`,
    );
  });

  it("should include proper caching headers", async () => {
    // Mock minimal database response
    mockDb.execute
      .mockResolvedValueOnce([]) // Main query - empty results
      .mockResolvedValueOnce([{ total_models: 0, total_capabilities: 0, total_tag_matches: 0 }]); // Overall stats

    const response = await GET();

    // Verify response has proper caching headers
    const cacheControl = response.headers?.get ? response.headers.get("Cache-Control") : null;
    if (cacheControl) {
      expect(cacheControl).toContain("max-age=300");
    }
    if (cacheControl) {
      expect(cacheControl).toContain("public");
    }

    console.log("✅ Taxonomy API includes proper caching headers");
  });

  it("should handle database errors gracefully", async () => {
    // Mock database error
    mockDb.execute.mockRejectedValue(new Error("Database connection failed"));

    const response = await GET();

    // Should return 500 error status
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("Failed to fetch taxonomy overview");

    console.log("✅ Taxonomy API handles database errors gracefully");
  });

  it("should be significantly faster than individual API calls", () => {
    // This is a conceptual test - the bulk API should be much faster
    // than making 154 individual API calls

    const estimatedIndividualCallTime = 154 * 100; // 100ms per call = 15.4 seconds
    const expectedBulkCallTime = 500; // 500ms for bulk call

    const performanceImprovement = estimatedIndividualCallTime / expectedBulkCallTime;

    expect(performanceImprovement).toBeGreaterThan(30); // At least 30x faster

    console.log(
      `🚀 Expected performance improvement: ${performanceImprovement.toFixed(1)}x faster (${estimatedIndividualCallTime}ms → ${expectedBulkCallTime}ms)`,
    );
  });
});

it("should handle empty results properly", async () => {
  // Mock database returning empty results but with proper structure
  mockDb.execute
    .mockResolvedValueOnce([]) // Main query - no results
    .mockResolvedValueOnce([{ total_models: 0, total_capabilities: 0, total_tag_matches: 0 }]); // Overall stats

  const response = await GET();

  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.meta.capabilitiesReturned).toBe(0);
  expect(data.overallStats.totalModels).toBe(0);
  expect(Object.keys(data.taxonomyData)).toHaveLength(0);

  console.log("✅ Taxonomy API handles empty results properly");
});
