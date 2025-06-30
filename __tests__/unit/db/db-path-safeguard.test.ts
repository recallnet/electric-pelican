// @ts-nocheck

import fs from "fs";
import os from "os";
import path from "path";

// Mock the neon adapter
jest.mock("@neondatabase/serverless", () => ({
  neon: jest.fn(() => ({
    // Mock SQL client functions
    query: jest.fn(),
  })),
}));

// Mock the drizzle ORM
jest.mock("drizzle-orm/neon-http", () => ({
  drizzle: jest.fn(() => ({
    // Mock drizzle functions
  })),
}));

describe("db path directory creation", () => {
  it("creates directory if missing", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pelican-db-test-"));
    const nestedDir = path.join(tempRoot, "nested");
    const dbFile = path.join(nestedDir, "dev.db");

    // Ensure directory is removed
    if (fs.existsSync(nestedDir)) {
      fs.rmSync(nestedDir, { recursive: true, force: true });
    }
    expect(fs.existsSync(nestedDir)).toBe(false);

    // Set env and import module (fresh)
    process.env.DATABASE_URL = `postgres://user:pass@localhost:5432/test?dbpath=${encodeURIComponent(dbFile)}`;
    jest.resetModules();
    await import("../../../db/index");

    // Directory should now exist
    expect(fs.existsSync(nestedDir)).toBe(true);
  });
});
