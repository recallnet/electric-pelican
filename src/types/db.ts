/**
 * @file Database type definitions.
 * @description Type declarations for the database and its schema.
 */

import { NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "../../db/schema";

/**
 * Type for the Drizzle ORM database instance (Neon PostgreSQL)
 */
export type DrizzleInstance = NeonHttpDatabase<typeof schema>;

/**
 * Type for the schema objects
 */
export type Schema = typeof schema;

/**
 * Re-export the schema for convenience
 */
export { schema };
