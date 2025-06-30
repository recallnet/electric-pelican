import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { URL } from "url";

// Fail fast if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create parent directories if DATABASE_URL contains a dbpath query parameter
try {
  // First try parsing as a URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  const dbPath = dbUrl.searchParams.get("dbpath");

  if (dbPath) {
    const dirPath = path.dirname(dbPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
} catch (e) {
  // If DATABASE_URL is not a valid URL, it might be a file path
  // Check if it looks like a file path and create directory if needed
  const dbUrlStr = process.env.DATABASE_URL;
  if (
    dbUrlStr.includes("/") &&
    !dbUrlStr.startsWith("postgres://") &&
    !dbUrlStr.startsWith("postgresql://")
  ) {
    const dirPath = path.dirname(dbUrlStr);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };

// ----- Helpful Type Aliases -------------------------------------------------
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Tournament = typeof schema.tournaments.$inferSelect;
export type NewTournament = typeof schema.tournaments.$inferInsert;

export type TournamentRun = typeof schema.tournamentRuns.$inferSelect;
export type NewTournamentRun = typeof schema.tournamentRuns.$inferInsert;

export type Fork = typeof schema.forks.$inferSelect;
export type NewFork = typeof schema.forks.$inferInsert;

export type TournamentUpvote = typeof schema.tournamentUpvotes.$inferSelect;
export type NewTournamentUpvote = typeof schema.tournamentUpvotes.$inferInsert;
