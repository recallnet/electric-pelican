import {
  getLeastMeasuredCapabilities,
  getUnmeasuredCapabilities,
  getCapabilityCoverage,
} from "@/lib/capability-analytics";

// Mock the database and taxonomy
jest.mock("../../db", () => ({
  db: {
    execute: jest.fn(),
  },
}));

jest.mock("@/lib/tag-taxonomy", () => ({
  getTagInfo: jest.fn(),
  leafIds: ["capability-1", "capability-2", "capability-3", "capability-4", "capability-5"],
}));

describe("Capability Analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLeastMeasuredCapabilities", () => {
    it("should identify least-measured capabilities correctly", async () => {
      const mockDbResults = [
        { tag_id: "capability-1", total_models: 3, total_matches: 6, avg_matches_per_model: 2 },
        { tag_id: "capability-2", total_models: 5, total_matches: 5, avg_matches_per_model: 1 },
        { tag_id: "capability-3", total_models: 2, total_matches: 8, avg_matches_per_model: 4 },
      ];

      const { db } = require("../../db");
      db.execute.mockResolvedValue(mockDbResults);

      const { getTagInfo } = require("@/lib/tag-taxonomy");
      getTagInfo.mockImplementation((tagId: string) => ({
        name: `${tagId} Name`,
        description: `${tagId} description`,
      }));

      const capabilities = await getLeastMeasuredCapabilities(3);

      expect(capabilities).toHaveLength(3);
      expect(capabilities[0]).toBeDefined();
      if (capabilities[0]) {
        expect(capabilities[0].tagId).toBe("capability-1");
        expect(capabilities[0].tagName).toBe("capability-1 Name");
        expect(capabilities[0].avgMatchesPerModel).toBe(2);
        expect(capabilities[0].totalModels).toBe(3);
        expect(capabilities[0].totalMatches).toBe(6);
      }

      // Should be ordered by avg_matches_per_model ASC
      expect(capabilities.map((c) => c.avgMatchesPerModel)).toEqual([2, 1, 4]);
    });

    it("should handle empty database gracefully", async () => {
      const { db } = require("../../db");
      db.execute.mockResolvedValue([]);

      const capabilities = await getLeastMeasuredCapabilities(3);
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities).toHaveLength(0);
    });

    it("should handle missing tag info gracefully", async () => {
      const mockDbResults = [
        {
          tag_id: "unknown-capability",
          total_models: 1,
          total_matches: 1,
          avg_matches_per_model: 1,
        },
      ];

      const { db } = require("../../db");
      db.execute.mockResolvedValue(mockDbResults);

      const { getTagInfo } = require("@/lib/tag-taxonomy");
      getTagInfo.mockReturnValue(null);

      const capabilities = await getLeastMeasuredCapabilities(1);
      expect(capabilities[0]).toBeDefined();
      if (capabilities[0]) {
        expect(capabilities[0].tagName).toBe("unknown-capability");
        expect(capabilities[0].tagDescription).toBe("");
      }
    });
  });

  describe("getUnmeasuredCapabilities", () => {
    it("should identify unmeasured capabilities", async () => {
      const mockMeasuredTags = [{ tag_id: "capability-1" }, { tag_id: "capability-3" }];

      const { db } = require("../../db");
      db.execute.mockResolvedValue(mockMeasuredTags);

      const unmeasured = await getUnmeasuredCapabilities();

      expect(Array.isArray(unmeasured)).toBe(true);
      expect(unmeasured).toContain("capability-2");
      expect(unmeasured).toContain("capability-4");
      expect(unmeasured).toContain("capability-5");
      expect(unmeasured).not.toContain("capability-1");
      expect(unmeasured).not.toContain("capability-3");
    });

    it("should return all capabilities when none are measured", async () => {
      const { db } = require("../../db");
      db.execute.mockResolvedValue([]);

      const unmeasured = await getUnmeasuredCapabilities();
      expect(unmeasured).toHaveLength(5);
      expect(unmeasured).toEqual([
        "capability-1",
        "capability-2",
        "capability-3",
        "capability-4",
        "capability-5",
      ]);
    });

    it("should return empty array when all capabilities are measured", async () => {
      const mockMeasuredTags = [
        { tag_id: "capability-1" },
        { tag_id: "capability-2" },
        { tag_id: "capability-3" },
        { tag_id: "capability-4" },
        { tag_id: "capability-5" },
      ];

      const { db } = require("../../db");
      db.execute.mockResolvedValue(mockMeasuredTags);

      const unmeasured = await getUnmeasuredCapabilities();
      expect(unmeasured).toHaveLength(0);
    });
  });

  describe("getCapabilityCoverage", () => {
    it("should return comprehensive coverage statistics", async () => {
      // Mock the database results for both functions
      const { db } = require("../../db");

      // Mock for getLeastMeasuredCapabilities
      db.execute
        .mockResolvedValueOnce([
          { tag_id: "capability-1", total_models: 2, total_matches: 2, avg_matches_per_model: 1 },
        ])
        // Mock for getUnmeasuredCapabilities
        .mockResolvedValueOnce([
          { tag_id: "capability-1" },
          { tag_id: "capability-2" },
          { tag_id: "capability-3" },
        ]);

      const { getTagInfo } = require("@/lib/tag-taxonomy");
      getTagInfo.mockImplementation((tagId: string) => ({
        name: `${tagId} Name`,
        description: `${tagId} description`,
      }));

      const coverage = await getCapabilityCoverage();

      expect(coverage.totalCapabilities).toBe(5);
      expect(coverage.unmeasuredCapabilities).toBe(2); // 5 total - 3 measured = 2 unmeasured
      expect(coverage.measuredCapabilities).toBe(3);
      expect(coverage.coveragePercentage).toBe(60);
      expect(coverage.leastMeasured).toHaveLength(1);
      expect(coverage.unmeasured).toHaveLength(2);
    });
  });
});
