import { leafIds } from "@/lib/tag-taxonomy";
import {
  formatTagsForPrompt,
  isHierarchicalTagId,
  suggestTagsFromPrompt,
  validateTagIds,
  validateTagNames,
} from "@/lib/tag-validation";

describe("Tag Validation", () => {
  describe("validateTagNames", () => {
    it("should validate valid tag names", () => {
      const result = validateTagNames([
        "Creative Writing",
        "Deductive Inference",
        "Scene Understanding",
      ]);
      expect(result.success).toBe(true);
      expect(result.validTags.length).toBeGreaterThan(0);
      expect(result.invalidTags).toEqual([]);
    });

    it("should reject invalid tag names", () => {
      const result = validateTagNames(["Not A Real Tag", "Creative Writing", "Another Fake Tag"]);
      expect(result.success).toBe(true); // Should succeed because Creative Writing is valid
      expect(result.validTags).toContain("creative-writing");
      expect(result.invalidTags).toContain("Not A Real Tag");
      expect(result.invalidTags).toContain("Another Fake Tag");
    });

    it("should handle empty input", () => {
      const result = validateTagNames([]);
      expect(result.success).toBe(false); // Empty input should fail
      expect(result.validTags).toEqual([]);
      expect(result.invalidTags).toEqual([]);
    });

    it("should handle case insensitivity", () => {
      const result = validateTagNames([
        "creative writing",
        "DEDUCTIVE inference",
        "Scene Understanding",
      ]);
      expect(result.success).toBe(true);
      // Check that it normalized to actual IDs
      expect(result.validTags).toContain("creative-writing");
      expect(result.validTags).toContain("deductive-inference");
      expect(result.validTags).toContain("scene-understanding");
    });

    it("should handle whitespace in tag names", () => {
      const result = validateTagNames(["  Creative Writing  ", "  Deductive Inference  "]);
      expect(result.success).toBe(true);
      expect(result.validTags).toContain("creative-writing");
      expect(result.validTags).toContain("deductive-inference");
    });
  });

  describe("validateTagIds", () => {
    it("should validate valid tag IDs", () => {
      const result = validateTagIds([
        "creative-writing",
        "deductive-inference",
        "scene-understanding",
      ]);
      expect(result.success).toBe(true);
      expect(result.validTags).toEqual([
        "creative-writing",
        "deductive-inference",
        "scene-understanding",
      ]);
      expect(result.invalidTags).toEqual([]);
    });

    it("should reject invalid tag IDs", () => {
      const result = validateTagIds(["not-real-id", "creative-writing", "another-fake-id"]);
      expect(result.success).toBe(true); // Should succeed because creative-writing is valid
      expect(result.validTags).toContain("creative-writing");
      expect(result.invalidTags).toContain("not-real-id");
      expect(result.invalidTags).toContain("another-fake-id");
    });

    it("should handle empty input", () => {
      const result = validateTagIds([]);
      expect(result.success).toBe(false); // Empty input should fail
      expect(result.validTags).toEqual([]);
      expect(result.invalidTags).toEqual([]);
    });
  });

  describe("isHierarchicalTagId", () => {
    it("should identify valid hierarchical tag IDs", () => {
      // Use a real tag ID from leafIds
      const validTagId = leafIds[0];
      if (validTagId) {
        expect(isHierarchicalTagId(validTagId)).toBe(true);
      }
    });

    it("should reject invalid hierarchical tag IDs", () => {
      expect(isHierarchicalTagId("not-a-real-tag-id")).toBe(false);
      expect(isHierarchicalTagId("factual")).toBe(false); // pillar, not leaf
      expect(isHierarchicalTagId("")).toBe(false);
    });
  });

  describe("formatTagsForPrompt", () => {
    it("should format tags for prompt", () => {
      const formatted = formatTagsForPrompt(3);
      expect(formatted).toContain("Available capability tags:");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should handle zero tags", () => {
      const formatted = formatTagsForPrompt(0);
      expect(formatted).toBe("Available capability tags: ");
    });
  });

  describe("suggestTagsFromPrompt", () => {
    it("should suggest tags based on prompt content", async () => {
      const result = await suggestTagsFromPrompt(
        "Write a logical proof for the Pythagorean theorem that is mathematically accurate.",
      );

      // We expect mathematically-related tags
      expect(
        result.some(
          (tag) =>
            tag === "mathematical-reasoning" ||
            tag === "conceptual-accuracy" ||
            tag === "logical-reasoning",
        ),
      ).toBe(true);
    });

    it("should handle prompts without clear tag matches", async () => {
      const result = await suggestTagsFromPrompt("Write something.");
      // Should return some default tags even for vague prompts
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
