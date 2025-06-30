/**
 * @file Tag validation utilities for hierarchical tagging system
 * @description Provides functions to validate AI-generated tag names against
 * the canonical taxonomy and convert them to structured tag IDs.
 */

import type { HierarchicalTagId, TagValidationResult } from "@/types/taxonomy";

import { leafIds, TAGS } from "./tag-taxonomy";

/**
 * Validates tag names returned by AI and converts them to tag IDs.
 * @param tagNames - Array of tag names returned by the AI model
 * @returns Validation result with valid IDs and any invalid names
 * @example
 * ```ts
 * const result = validateTagNames(['Scene Understanding', 'invalid-tag', 'Creative Writing']);
 * // Returns: { validTags: ['scene-understanding', 'creative-writing'], invalidTags: ['invalid-tag'], success: true }
 * ```
 */
export function validateTagNames(tagNames: string[]): TagValidationResult {
  const validTags: HierarchicalTagId[] = [];
  const invalidTags: string[] = [];

  // Create a mapping from tag names to IDs for efficient lookup
  const nameToIdMap = new Map<string, string>();
  TAGS.forEach((tag) => {
    // Store both exact name and lowercase version for fuzzy matching
    nameToIdMap.set(tag.name.toLowerCase(), tag.id);
    nameToIdMap.set(tag.name, tag.id);
  });

  for (const tagName of tagNames) {
    if (!tagName?.trim()) continue;

    const normalizedName = tagName.trim();

    // Try exact match first
    let tagId = nameToIdMap.get(normalizedName);

    // If no exact match, try case-insensitive
    if (!tagId) {
      tagId = nameToIdMap.get(normalizedName.toLowerCase());
    }

    if (tagId && (leafIds as readonly string[]).includes(tagId)) {
      // Only accept leaf tags (L3)
      validTags.push(tagId as HierarchicalTagId);
    } else {
      invalidTags.push(normalizedName);
    }
  }

  return {
    validTags: [...new Set(validTags)], // Remove duplicates
    invalidTags,
    success: validTags.length > 0,
  };
}

/**
 * Gets the leaf tag names formatted for AI prompt inclusion.
 * @returns Array of leaf tag names suitable for few-shot prompting
 * @example
 * ```ts
 * const leafNames = getLeafTagNames();
 * // Returns: ['Scene Understanding', 'Creative Writing', 'Algorithm Implementation', ...]
 * ```
 */
export function getLeafTagNames(): string[] {
  return TAGS.filter((tag) => (leafIds as readonly string[]).includes(tag.id))
    .map((tag) => tag.name)
    .sort();
}

/**
 * Formats tag names for inclusion in AI system prompts.
 * @param maxTags - Maximum number of tags to include in prompt (default: all leaf tags)
 * @returns Formatted string of tag names for prompt inclusion
 * @example
 * ```ts
 * const promptText = formatTagsForPrompt(20);
 * // Returns: "Available capability tags: Scene Understanding, Creative Writing, Algorithm Implementation..."
 * ```
 */
export function formatTagsForPrompt(maxTags?: number): string {
  const leafNames = getLeafTagNames();
  const tagsToInclude = maxTags !== undefined ? leafNames.slice(0, maxTags) : leafNames;
  return `Available capability tags: ${tagsToInclude.join(", ")}`;
}

/**
 * Checks if a string is a valid hierarchical tag ID.
 * @param id - The string to check
 * @returns True if the ID is a valid leaf tag in the taxonomy
 * @example
 * ```ts
 * const isValid = isHierarchicalTagId('scene-understanding'); // true
 * const isInvalid = isHierarchicalTagId('not-a-tag'); // false
 * ```
 */
export function isHierarchicalTagId(id: string): id is HierarchicalTagId {
  return (leafIds as readonly string[]).includes(id);
}

/**
 * Validates that tag IDs are valid leaf nodes in the taxonomy.
 * @param tagIds - Array of tag IDs to validate
 * @returns Validation result with valid and invalid tag IDs
 * @example
 * ```ts
 * const result = validateTagIds(['scene-understanding', 'invalid-id', 'creative-writing']);
 * // Returns: { validTags: ['scene-understanding', 'creative-writing'], invalidTags: ['invalid-id'], success: true }
 * ```
 */
export function validateTagIds(tagIds: string[]): TagValidationResult {
  const validTags: HierarchicalTagId[] = [];
  const invalidTags: string[] = [];

  for (const id of tagIds) {
    if (isHierarchicalTagId(id)) {
      validTags.push(id);
    } else {
      invalidTags.push(id);
    }
  }

  return {
    validTags: [...new Set(validTags)], // Remove duplicates
    invalidTags,
    success: validTags.length > 0,
  };
}

/**
 * Gets tag suggestions based on a text prompt using simple keyword matching.
 * This is a fallback when AI tagging fails or for initial tag suggestions.
 * @param prompt - The challenge prompt text to analyze
 * @param maxSuggestions - Maximum number of suggestions to return (default: 3)
 * @returns Array of suggested tag IDs based on keyword matching
 * @example
 * ```ts
 * const suggestions = suggestTagsFromPrompt("Write a creative story about space");
 * // Returns: ['creative-writing', 'narrative-generation', 'artistic-creation']
 * ```
 */
export function suggestTagsFromPrompt(
  prompt: string,
  maxSuggestions: number = 3,
): HierarchicalTagId[] {
  const lowerPrompt = prompt.toLowerCase();
  const suggestions: Array<{ id: HierarchicalTagId; score: number }> = [];

  // Simple keyword-based scoring
  const keywords = {
    "creative-writing": ["story", "creative", "narrative", "write", "fiction"],
    "algorithm-implementation": ["code", "algorithm", "implement", "program", "function"],
    "scene-understanding": ["image", "visual", "scene", "picture", "describe"],
    "mathematical-computation": ["math", "calculate", "equation", "number", "compute"],
    "instruction-following": ["follow", "instruction", "step", "guide", "procedure"],
    "formal-writing": ["formal", "professional", "business", "academic", "report"],
    "data-analysis": ["data", "analyze", "statistics", "chart", "graph"],
    "logical-reasoning": ["logic", "reason", "think", "analyze", "deduce"],
  } as const;

  for (const [tagId, words] of Object.entries(keywords)) {
    let score = 0;
    for (const word of words) {
      if (lowerPrompt.includes(word)) {
        score += 1;
      }
    }
    if (score > 0) {
      suggestions.push({ id: tagId as HierarchicalTagId, score });
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map((s) => s.id);
}
