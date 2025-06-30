import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function runMigrations() {
  // Initialize database connection for migrations
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql, schema });

  // Run migrations
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations complete.");
}

runMigrations().catch(console.error);
