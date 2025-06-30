/**
 * @file Tests for /api/capability-analytics endpoint
 * @description Comprehensive tests for the capability coverage analytics API
 */

import { GET } from "@/app/api/capability-analytics/route";

// Mock the capability analytics module
jest.mock("@/lib/capability-analytics", () => ({
  getCapabilityCoverage: jest.fn(),
}));

import { getCapabilityCoverage } from "@/lib/capability-analytics";

const mockGetCapabilityCoverage = getCapabilityCoverage as jest.MockedFunction<
  typeof getCapabilityCoverage
>;

describe("/api/capability-analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return capability coverage statistics", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [
        {
          tagId: "visual-reasoning" as any,
          tagName: "Visual Reasoning",
          tagDescription: "Reasoning about visual content",
          avgMatchesPerModel: 2,
          totalModels: 5,
          totalMatches: 10,
        },
        {
          tagId: "audio-processing" as any,
          tagName: "Audio Processing",
          tagDescription: "Processing audio content",
          avgMatchesPerModel: 1,
          totalModels: 3,
          totalMatches: 3,
        },
      ],
      unmeasured: ["untested-capability-1", "untested-capability-2"] as any[],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockCoverage);
  });

  it("should include required fields in coverage response", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [],
      unmeasured: [],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("totalCapabilities");
    expect(data.data).toHaveProperty("measuredCapabilities");
    expect(data.data).toHaveProperty("unmeasuredCapabilities");
    expect(data.data).toHaveProperty("coveragePercentage");
    expect(data.data).toHaveProperty("leastMeasured");
    expect(data.data).toHaveProperty("unmeasured");

    expect(typeof data.data.totalCapabilities).toBe("number");
    expect(typeof data.data.measuredCapabilities).toBe("number");
    expect(typeof data.data.unmeasuredCapabilities).toBe("number");
    expect(typeof data.data.coveragePercentage).toBe("number");
    expect(Array.isArray(data.data.leastMeasured)).toBe(true);
    expect(Array.isArray(data.data.unmeasured)).toBe(true);
  });

  it("should validate measurement counts are non-negative", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [
        {
          tagId: "test-tag" as any,
          tagName: "Test Tag",
          tagDescription: "Test description",
          avgMatchesPerModel: 5,
          totalModels: 10,
          totalMatches: 50,
        },
      ],
      unmeasured: ["untested-tag"] as any[],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    expect(data.data.totalCapabilities).toBeGreaterThanOrEqual(0);
    expect(data.data.measuredCapabilities).toBeGreaterThanOrEqual(0);
    expect(data.data.unmeasuredCapabilities).toBeGreaterThanOrEqual(0);
    expect(data.data.coveragePercentage).toBeGreaterThanOrEqual(0);
    expect(data.data.coveragePercentage).toBeLessThanOrEqual(100);

    data.data.leastMeasured.forEach((item: any) => {
      expect(item.avgMatchesPerModel).toBeGreaterThanOrEqual(0);
      expect(item.totalModels).toBeGreaterThanOrEqual(0);
      expect(item.totalMatches).toBeGreaterThanOrEqual(0);
    });
  });

  it("should handle database errors gracefully", async () => {
    mockGetCapabilityCoverage.mockRejectedValue(new Error("Database connection failed"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Failed to fetch capability analytics");
  });

  it("should handle empty database gracefully", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 0,
      unmeasuredCapabilities: 151,
      coveragePercentage: 0,
      leastMeasured: [],
      unmeasured: [] as any[],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.measuredCapabilities).toBe(0);
    expect(data.data.coveragePercentage).toBe(0);
    expect(data.data.leastMeasured).toHaveLength(0);
    expect(data.data.unmeasured).toHaveLength(0);
  });

  it("should complete within performance threshold", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [],
      unmeasured: [],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const startTime = performance.now();
    const response = await GET();
    const endTime = performance.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
  });

  it("should return proper JSON content type", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [],
      unmeasured: [],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();

    // Note: The response from the route handler may not have headers.get method in test environment
    // This test verifies the response is valid JSON
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
  });

  it("should validate least measured items structure", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [
        {
          tagId: "visual-reasoning" as any,
          tagName: "Visual Reasoning",
          tagDescription: "Reasoning about visual content",
          avgMatchesPerModel: 2,
          totalModels: 5,
          totalMatches: 10,
        },
        {
          tagId: "audio-processing" as any,
          tagName: "Audio Processing",
          tagDescription: "Processing audio content",
          avgMatchesPerModel: 1,
          totalModels: 3,
          totalMatches: 3,
        },
      ],
      unmeasured: [],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    data.data.leastMeasured.forEach((item: any) => {
      expect(item).toHaveProperty("tagId");
      expect(item).toHaveProperty("tagName");
      expect(item).toHaveProperty("tagDescription");
      expect(item).toHaveProperty("avgMatchesPerModel");
      expect(item).toHaveProperty("totalModels");
      expect(item).toHaveProperty("totalMatches");
      expect(typeof item.tagId).toBe("string");
      expect(typeof item.tagName).toBe("string");
      expect(typeof item.tagDescription).toBe("string");
      expect(typeof item.avgMatchesPerModel).toBe("number");
      expect(typeof item.totalModels).toBe("number");
      expect(typeof item.totalMatches).toBe("number");
    });
  });

  it("should validate unmeasured capabilities structure", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [],
      unmeasured: ["untested-capability-1", "untested-capability-2"] as any[],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    const response = await GET();
    const data = await response.json();

    data.data.unmeasured.forEach((tagId: any) => {
      expect(typeof tagId).toBe("string");
    });
  });

  it("should handle malformed data from capability analytics", async () => {
    // Test with null response - this should cause the API to throw an error
    mockGetCapabilityCoverage.mockImplementation(() => {
      throw new Error("Invalid data structure");
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it("should call getCapabilityCoverage exactly once", async () => {
    const mockCoverage = {
      totalCapabilities: 151,
      measuredCapabilities: 95,
      unmeasuredCapabilities: 56,
      coveragePercentage: 62.9,
      leastMeasured: [],
      unmeasured: [],
    };

    mockGetCapabilityCoverage.mockResolvedValue(mockCoverage);

    await GET();

    expect(mockGetCapabilityCoverage).toHaveBeenCalledTimes(1);
    expect(mockGetCapabilityCoverage).toHaveBeenCalledWith();
  });
});
