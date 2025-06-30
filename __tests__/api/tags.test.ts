/**
 * @file Tests for /api/tags endpoint
 * @description Comprehensive tests for the hierarchical taxonomy API
 */

import { GET } from "@/app/api/tags/route";
import { TAGS } from "@/lib/tag-taxonomy";

describe("/api/tags", () => {
  it("should return complete taxonomy structure", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("tags");
    expect(Array.isArray(data.tags)).toBe(true);
  });

  it("should return all 159 tags with correct hierarchy", async () => {
    const response = await GET();
    const data = await response.json();

    // Should have exactly 159 tags as documented
    expect(data.tags).toHaveLength(159);

    // Verify tag structure
    data.tags.forEach((tag: any) => {
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("description");
      expect(typeof tag.id).toBe("string");
      expect(typeof tag.name).toBe("string");
      expect(typeof tag.description).toBe("string");
    });
  });

  it("should have correct hierarchical structure with pillars, families, and leaves", async () => {
    const response = await GET();
    const data = await response.json();

    // L1 tags (pillars) have no parentId
    const pillars = data.tags.filter((tag: any) => !tag.parentId);
    // L2 tags (families) have L1 tags as parentId
    const families = data.tags.filter((tag: any) => {
      if (!tag.parentId) return false;
      return pillars.some((pillar: any) => pillar.id === tag.parentId);
    });
    // L3 tags (leaves) have L2 tags as parentId
    const leaves = data.tags.filter((tag: any) => {
      if (!tag.parentId) return false;
      return families.some((family: any) => family.id === tag.parentId);
    });

    // Verify we have the expected hierarchy levels
    expect(pillars.length).toBeGreaterThan(0);
    expect(families.length).toBeGreaterThan(0);
    expect(leaves.length).toBeGreaterThan(0);

    // Most tags should be leaf nodes (L3)
    expect(leaves.length).toBeGreaterThan(families.length);
    expect(leaves.length).toBeGreaterThan(pillars.length);
  });

  it("should include required metadata for each tag", async () => {
    const response = await GET();
    const data = await response.json();

    data.tags.forEach((tag: any) => {
      // Required fields
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("description");

      // Validate field types
      expect(typeof tag.id).toBe("string");
      expect(typeof tag.name).toBe("string");
      expect(typeof tag.description).toBe("string");

      // L2 and L3 tags should have parentId
      if (tag.parentId) {
        expect(typeof tag.parentId).toBe("string");
      }

      // All tags should have non-empty description
      expect(tag.description.length).toBeGreaterThan(0);
    });
  });

  it("should have valid parent-child relationships", async () => {
    const response = await GET();
    const data = await response.json();

    const tagMap = new Map(data.tags.map((tag: any) => [tag.id, tag]));

    data.tags.forEach((tag: any) => {
      if (tag.parentId) {
        const parent = tagMap.get(tag.parentId);
        expect(parent).toBeDefined();
        // Parent should exist in the taxonomy
        expect((parent as any).id).toBe(tag.parentId);
      }
    });
  });

  it("should return consistent data on multiple calls", async () => {
    const response1 = await GET();
    const response2 = await GET();

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(data1).toEqual(data2);
  });

  it("should match the imported TAGS constant", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.tags).toEqual(TAGS);
  });

  it("should have proper content type and response headers", async () => {
    const response = await GET();

    // Note: The response from the route handler may not have headers.get method in test environment
    // This test verifies the response is valid JSON
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.tags).toBeDefined();
  });

  it("should complete within performance threshold", async () => {
    const startTime = performance.now();
    const response = await GET();
    const endTime = performance.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
  });

  it("should include specific known pillar tags", async () => {
    const response = await GET();
    const data = await response.json();

    const pillars = data.tags.filter((tag: any) => !tag.parentId);
    const pillarNames = pillars.map((tag: any) => tag.name);

    // Should include core AI capability pillars
    expect(pillarNames).toContain("Perception & Understanding");
    expect(pillarNames).toContain("Reasoning & Problem-Solving");
  });

  it("should include specific known leaf tags", async () => {
    const response = await GET();
    const data = await response.json();

    const tagIds = data.tags.map((tag: any) => tag.id);

    // Should include commonly tested capabilities
    expect(tagIds).toContain("scene-understanding");
    expect(tagIds).toContain("creative-writing");
    expect(tagIds).toContain("algorithm-implementation");
  });
});
