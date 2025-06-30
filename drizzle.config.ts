import type { Config } from "drizzle-kit";

/**
 * Drizzle configuration for both development (SQLite) and production (PostgreSQL).
 * The CLI will detect `process.env.DATABASE_URL` at runtime to connect.
 */
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
