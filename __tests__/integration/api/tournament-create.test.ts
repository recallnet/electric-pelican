/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/tournament/route";
import { getAuthenticatedUser } from "@/lib/auth/privy";
import { createTournament } from "@/lib/tournament-db";

jest.mock("@/lib/auth/privy");
jest.mock("@/lib/tournament-db");

const mockGetAuth = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
const mockCreateTournament = createTournament as jest.MockedFunction<typeof createTournament>;

describe("/api/tournament", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates tournament and returns 201", async () => {
    mockGetAuth.mockResolvedValue({ sub: "user-1" } as any);
    mockCreateTournament.mockResolvedValue("tournament-id-123");

    const request = new NextRequest("http://localhost:3000/api/tournament", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Prompt",
        models: ["a", "b", "c", "d"],
        bracketSize: 4,
        judgeModel: "judge",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("tournament-id-123");
    expect(mockCreateTournament).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Prompt" }),
      "user-1",
    );
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuth.mockResolvedValue(null as any);

    const request = new NextRequest("http://localhost:3000/api/tournament", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
