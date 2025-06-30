// Jest imports are global

import { generateFallbackMetadata } from "@/lib/prompt-metadata";

describe("Prompt Metadata Generation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe("generateFallbackMetadata", () => {
    it("should generate fallback metadata using keyword matching", () => {
      const result = generateFallbackMetadata("Write a logical proof for the Pythagorean theorem.");

      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("tags");
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.title).toBeTruthy();
    });

    it("should always generate metadata with both hierarchical and legacy tags", () => {
      const result = generateFallbackMetadata("Write a creative story about space exploration.");

      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("tags");
      expect(result).toHaveProperty("tagIds");
      expect(Array.isArray(result.tags)).toBe(true);
      expect(Array.isArray(result.tagIds)).toBe(true);
      expect(result.tags).toEqual(result.tagIds); // Should be the same for dual-write
    });
  });
});
