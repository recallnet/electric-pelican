import type { Config } from "drizzle-kit";

/**
 * Special drizzle configuration for generating admin table migration.
 */
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Force creation mode
  breakpoints: false,
  introspect: {
    casing: "camel",
  },
} satisfies Config;
