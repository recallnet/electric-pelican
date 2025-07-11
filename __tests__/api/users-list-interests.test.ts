/**
 * @file Users List API Tests - Interests Column
 * @description Tests for the users list API tag aggregation functionality
 */

import { GET } from "@/app/api/users/list/route";
import { NextRequest } from "next/server";

// Mock database and schema
jest.mock("../../db", () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          groupBy: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
        where: jest.fn(() => Promise.resolve([])),
      })),
    })),
  },
  schema: {
    users: {
      id: "users.id",
      displayName: "users.display_name",
      avatarUrl: "users.avatar_url",
      provider: "users.provider",
      providerUsername: "users.provider_username",
      createdAt: "users.created_at",
    },
    tournaments: {
      id: "tournaments.id",
      createdBy: "tournaments.created_by",
      tags: "tournaments.tags",
      tagIds: "tournaments.tag_ids",
    },
  },
}));

describe("Users List API - Interests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return users with empty topTags when no tournaments exist", async () => {
    const { db } = await import("../../db");

    // Mock users with no tournaments
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          groupBy: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() =>
                  Promise.resolve([
                    {
                      id: "user1",
                      displayName: "Test User",
                      avatarUrl: null,
                      provider: "email",
                      providerUsername: "test",
                      createdAt: new Date("2024-01-01"),
                      evaluationsCreated: 0,
                      topTags: [],
                    },
                  ]),
                ),
              })),
            })),
          })),
        })),
        where: jest.fn(() => Promise.resolve([])),
      })),
    }));

    const request = new NextRequest("http://localhost:3000/api/users/list");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].topTags).toEqual([]);
  });

  it("should return users with aggregated tags from tournaments", async () => {
    const { db } = await import("../../db");

    // Mock users with tournaments containing tags
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          groupBy: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() =>
                  Promise.resolve([
                    {
                      id: "user1",
                      displayName: "Test User",
                      avatarUrl: null,
                      provider: "email",
                      providerUsername: "test",
                      createdAt: new Date("2024-01-01"),
                      evaluationsCreated: 3,
                      topTags: ["reasoning", "coding", "writing"], // Mock aggregated tags
                    },
                  ]),
                ),
              })),
            })),
          })),
        })),
        where: jest.fn(() =>
          Promise.resolve([
            { tags: ["reasoning", "coding"], tagIds: null },
            { tags: ["coding", "writing"], tagIds: null },
            { tags: ["reasoning", "writing"], tagIds: null },
          ]),
        ),
      })),
    }));

    const request = new NextRequest("http://localhost:3000/api/users/list");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].topTags).toEqual(["reasoning", "coding", "writing"]);
    expect(data.users[0].topTags.length).toBeLessThanOrEqual(3); // Max 3 tags
  });

  it("should handle pagination parameters correctly", async () => {
    const { db } = await import("../../db");

    const mockData = Array.from({ length: 25 }, (_, i) => ({
      id: `user${i + 1}`,
      displayName: `User ${i + 1}`,
      avatarUrl: null,
      provider: "email",
      providerUsername: `user${i + 1}`,
      createdAt: new Date("2024-01-01"),
      evaluationsCreated: i,
      topTags: [`tag${i % 3}`], // Mix of different tags
    }));

    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          groupBy: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn((limit) => ({
                offset: jest.fn((offset) => {
                  const start = offset;
                  const end = Math.min(start + limit, mockData.length);
                  return Promise.resolve(mockData.slice(start, end));
                }),
              })),
            })),
          })),
        })),
        where: jest.fn(() => Promise.resolve([])),
      })),
    }));

    // Test page 2 with limit 10
    const request = new NextRequest("http://localhost:3000/api/users/list?page=2&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(10);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.hasMore).toBe(true);
  });

  it("should validate pagination parameters", async () => {
    // Test invalid page
    const request1 = new NextRequest("http://localhost:3000/api/users/list?page=0");
    const response1 = await GET(request1);
    expect(response1.status).toBe(400);

    // Test invalid limit
    const request2 = new NextRequest("http://localhost:3000/api/users/list?limit=200");
    const response2 = await GET(request2);
    expect(response2.status).toBe(400);
  });

  it("should handle database errors gracefully", async () => {
    const { db } = await import("../../db");

    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          groupBy: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn(() => Promise.reject(new Error("Database error"))),
              })),
            })),
          })),
        })),
      })),
    }));

    const request = new NextRequest("http://localhost:3000/api/users/list");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Internal server error");
  });
});
