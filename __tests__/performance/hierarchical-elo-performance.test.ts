/**
 * @jest-environment node
 */

import type { HierarchicalTagId } from "@/types/taxonomy";

// Mock database operations for performance testing
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  onConflictDoNothing: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  transaction: jest.fn(),
};

const mockModelTagScores = {
  modelId: "modelId",
  tagId: "tagId",
  eloScore: "eloScore",
  matchesPlayed: "matchesPlayed",
  wins: "wins",
  losses: "losses",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

jest.mock("../../db", () => ({
  db: mockDb,
}));

jest.mock("../../db/schema", () => ({
  modelTagScores: mockModelTagScores,
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => `eq(${field}, ${value})`),
  sql: jest.fn((strings, ...values) => `sql(${strings.join("")})`),
  desc: jest.fn((field) => `desc(${field})`),
  and: jest.fn((...conditions) => `and(${conditions.join(", ")})`),
}));

// Mock tag taxonomy functions
const mockGetTagLineage = jest.fn();
jest.mock("@/lib/tag-taxonomy", () => ({
  getTagLineage: mockGetTagLineage,
}));

// Mock ELO calculation function
const mockCalculateNewEloRating = jest.fn();
jest.mock("@/lib/elo-scoring", () => ({
  calculateNewEloRating: mockCalculateNewEloRating,
}));

// Import functions after mocking
import {
  getOrCreateModelTagScore,
  updateHierarchicalEloScores,
  getTagLeaderboard,
} from "@/lib/hierarchical-elo-scoring";

describe.skip("Hierarchical ELO Performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock behaviors
    mockGetTagLineage.mockReturnValue([
      { id: "perception-understanding", name: "Perception & Understanding" },
      { id: "visual-processing", name: "Visual Processing" },
      { id: "scene-understanding", name: "Scene Understanding" },
    ]);

    mockCalculateNewEloRating.mockImplementation((currentRating, opponentRating, score) => {
      // Simple mock ELO calculation
      const K = 32;
      const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
      return Math.round(currentRating + K * (score - expectedScore));
    });

    // Setup fast database responses
    mockDb.insert.mockResolvedValue(undefined);
    mockDb.update.mockResolvedValue(undefined);
    mockDb.select.mockResolvedValue([
      {
        id: "test-id",
        modelId: "test-model",
        tagId: "scene-understanding",
        eloScore: 1200,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  describe("Database Performance", () => {
    it("should create model tag scores in <10ms", async () => {
      const start = performance.now();

      await getOrCreateModelTagScore("perf-test-model", "scene-understanding");

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);
    });

    it("should update hierarchical scores in <50ms", async () => {
      const start = performance.now();

      await updateHierarchicalEloScores({
        tournamentRunId: "perf-test",
        roundNumber: 1,
        winnerModelId: "model-a",
        loserModelId: "model-b",
        tournamentTagIds: ["scene-understanding", "logical-reasoning"] as HierarchicalTagId[],
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it("should retrieve tag leaderboard in <100ms for large datasets", async () => {
      // Mock large dataset response
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `score-${i}`,
        modelId: `model-${i}`,
        tagId: "scene-understanding",
        eloScore: 1200 + Math.floor(Math.random() * 400),
        matchesPlayed: Math.floor(Math.random() * 50),
        wins: Math.floor(Math.random() * 25),
        losses: Math.floor(Math.random() * 25),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Mock count query
      mockDb.select
        .mockResolvedValueOnce([{ count: 1000 }])
        .mockResolvedValueOnce(largeDataset.slice(0, 50));

      const start = performance.now();

      const leaderboard = await getTagLeaderboard("scene-understanding", { limit: 50 });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
      expect(leaderboard.models.length).toBe(50);
      expect(leaderboard.pagination.total).toBe(1000);
    });

    it("should handle concurrent updates efficiently", async () => {
      const concurrentUpdates = 10;
      const promises = Array.from({ length: concurrentUpdates }, (_, i) =>
        updateHierarchicalEloScores({
          tournamentRunId: `concurrent-test-${i}`,
          roundNumber: 1,
          winnerModelId: `model-${i}`,
          loserModelId: `model-${i + concurrentUpdates}`,
          tournamentTagIds: ["scene-understanding"] as HierarchicalTagId[],
        }),
      );

      const start = performance.now();
      await Promise.all(promises);
      const duration = performance.now() - start;

      // Should complete all updates in reasonable time
      expect(duration).toBeLessThan(500);
    });

    it("should scale linearly with number of tags", async () => {
      const singleTagTime = await measureUpdateTime(["scene-understanding"] as HierarchicalTagId[]);
      const multiTagTime = await measureUpdateTime([
        "scene-understanding",
        "logical-reasoning",
        "creative-writing",
        "code-generation",
      ] as HierarchicalTagId[]);

      // Multi-tag should be roughly 4x single tag time (with some tolerance)
      expect(multiTagTime).toBeLessThan(singleTagTime * 6); // Allow 50% overhead
    });

    it("should maintain performance with deep hierarchies", async () => {
      // Mock deep hierarchy
      mockGetTagLineage.mockReturnValue([
        { id: "level-1", name: "Level 1" },
        { id: "level-2", name: "Level 2" },
        { id: "level-3", name: "Level 3" },
        { id: "level-4", name: "Level 4" },
        { id: "level-5", name: "Level 5" },
        { id: "deep-tag", name: "Deep Tag" },
      ]);

      const start = performance.now();

      await updateHierarchicalEloScores({
        tournamentRunId: "deep-test",
        roundNumber: 1,
        winnerModelId: "model-a",
        loserModelId: "model-b",
        tournamentTagIds: ["deep-tag"] as HierarchicalTagId[],
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should handle deep hierarchies efficiently
    });
  });

  describe("Memory Usage", () => {
    it("should not leak memory during extended operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await updateHierarchicalEloScores({
          tournamentRunId: `memory-test-${i}`,
          roundNumber: 1,
          winnerModelId: `model-${i}`,
          loserModelId: `model-${i + 100}`,
          tournamentTagIds: ["scene-understanding"] as HierarchicalTagId[],
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for mocked operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it("should handle large result sets efficiently", async () => {
      // Mock very large dataset
      const hugeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `score-${i}`,
        modelId: `model-${i}`,
        tagId: "scene-understanding",
        eloScore: 1200 + Math.floor(Math.random() * 400),
        matchesPlayed: Math.floor(Math.random() * 50),
        wins: Math.floor(Math.random() * 25),
        losses: Math.floor(Math.random() * 25),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockDb.select
        .mockResolvedValueOnce([{ count: 10000 }])
        .mockResolvedValueOnce(hugeDataset.slice(0, 100));

      const initialMemory = process.memoryUsage().heapUsed;

      const leaderboard = await getTagLeaderboard("scene-understanding", {
        limit: 100,
        page: 1,
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryUsed = finalMemory - initialMemory;

      expect(leaderboard.models.length).toBe(100);
      expect(memoryUsed).toBeLessThan(5 * 1024 * 1024); // Less than 5MB for 100 records
    });
  });

  describe("Stress Testing", () => {
    it("should handle rapid successive updates", async () => {
      const rapidUpdates = Array.from({ length: 50 }, (_, i) =>
        updateHierarchicalEloScores({
          tournamentRunId: `rapid-${i}`,
          roundNumber: 1,
          winnerModelId: "model-a",
          loserModelId: "model-b",
          tournamentTagIds: ["scene-understanding"] as HierarchicalTagId[],
        }),
      );

      const start = performance.now();
      await Promise.all(rapidUpdates);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete 50 updates in under 1 second
    });

    it("should maintain performance under mixed workload", async () => {
      const mixedOperations = [
        // Create operations
        ...Array.from({ length: 20 }, (_, i) =>
          getOrCreateModelTagScore(`mixed-model-${i}`, "scene-understanding"),
        ),
        // Update operations
        ...Array.from({ length: 10 }, (_, i) =>
          updateHierarchicalEloScores({
            tournamentRunId: `mixed-${i}`,
            roundNumber: 1,
            winnerModelId: `model-${i}`,
            loserModelId: `model-${i + 10}`,
            tournamentTagIds: ["scene-understanding"] as HierarchicalTagId[],
          }),
        ),
        // Query operations
        ...Array.from({ length: 5 }, () => getTagLeaderboard("scene-understanding", { limit: 20 })),
      ];

      const start = performance.now();
      await Promise.all(mixedOperations);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000); // Mixed workload should complete in under 2 seconds
    });
  });

  describe("Scalability Benchmarks", () => {
    it("should demonstrate O(n) scaling with tournament tags", async () => {
      const measurements: { tags: number; time: number }[] = [];

      for (const tagCount of [1, 2, 4, 8]) {
        const tags = Array.from({ length: tagCount }, (_, i) => `tag-${i}` as HierarchicalTagId);

        const time = await measureUpdateTime(tags);
        measurements.push({ tags: tagCount, time });
      }

      // Verify roughly linear scaling
      const firstMeasurement = measurements[0];
      const lastMeasurement = measurements[3];
      if (firstMeasurement && lastMeasurement) {
        const timeRatio = lastMeasurement.time / firstMeasurement.time; // 8 tags vs 1 tag
        expect(timeRatio).toBeLessThan(10); // Should be close to 8x, allowing for overhead
      }
    });

    it("should demonstrate efficient pagination", async () => {
      // Mock different page sizes
      const pageSizes = [10, 50, 100, 500];
      const times: number[] = [];

      for (const pageSize of pageSizes) {
        mockDb.select.mockResolvedValueOnce([{ count: 10000 }]).mockResolvedValueOnce(
          Array.from({ length: pageSize }, (_, i) => ({
            id: `score-${i}`,
            modelId: `model-${i}`,
            tagId: "scene-understanding",
            eloScore: 1200,
            matchesPlayed: 10,
            wins: 5,
            losses: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        );

        const start = performance.now();
        await getTagLeaderboard("scene-understanding", { limit: pageSize });
        const duration = performance.now() - start;
        times.push(duration);
      }

      // All pagination operations should be fast
      times.forEach((time) => {
        expect(time).toBeLessThan(50);
      });
    });
  });
});

/**
 * Helper function to measure update time for given tags
 */
async function measureUpdateTime(tags: HierarchicalTagId[]): Promise<number> {
  const start = performance.now();

  await updateHierarchicalEloScores({
    tournamentRunId: "benchmark",
    roundNumber: 1,
    winnerModelId: "model-a",
    loserModelId: "model-b",
    tournamentTagIds: tags,
  });

  return performance.now() - start;
}
