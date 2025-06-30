import postgres from "postgres";

export const runtime = "nodejs";

// Initialize postgres client
export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production",
  max: 1,
});

// eslint-disable-next-line custom/type-organization
export type SQL = typeof sql;
