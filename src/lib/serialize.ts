import { z } from "zod";

/**
 * Safely serializes JSON data before storing in DB (stringify).
 */
export function toDB<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Safely parses JSON string from DB. Returns fallback when parse fails.
 */
export function fromDB<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Helper to create Zod-validated JSON column.
 */
export const jsonString = <T extends z.ZodTypeAny>(schema: T) =>
  z.string().transform((val: string) => {
    try {
      const parsed = JSON.parse(val);
      return schema.parse(parsed) as z.infer<T>;
    } catch {
      throw new Error("Invalid JSON payload for column");
    }
  });
