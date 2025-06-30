import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";

/**
 * Test database configuration and utilities
 */

export interface TestDatabase {
  db: ReturnType<typeof drizzle>;
  sql: ReturnType<typeof postgres>;
  cleanup: () => Promise<void>;
}

/**
 * Create a test database connection with proper cleanup
 * Uses environment variable TEST_DATABASE_URL or falls back to a local test database
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://test:test@localhost:5432/model_eval_test";

  const sql = postgres(testDbUrl, {
    max: 1, // Single connection for tests
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  const db = drizzle(sql, { schema });

  // Clean up function
  const cleanup = async () => {
    try {
      // Clean up test data in dependency order
      await db.delete(schema.tournaments);
      await db.delete(schema.users);
    } catch (error) {
      console.warn("Error cleaning up test data:", error);
    }

    try {
      await sql.end();
    } catch (error) {
      console.warn("Error closing database connection:", error);
    }
  };

  return { db, sql, cleanup };
}

/**
 * Clean all test data from the database
 * Useful for beforeAll/afterAll hooks
 */
export async function cleanTestData(db: ReturnType<typeof drizzle>) {
  // Delete in dependency order to avoid foreign key constraint violations
  await db.delete(schema.tournaments);
  await db.delete(schema.users);
}
