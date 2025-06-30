import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/privy";
import { CreateTournamentInput } from "@/types/tournament";

export const runtime = "nodejs";

/**
 * POST /api/tournament
 * Creates a new tournament configuration. Auth required.
 */
export async function POST(request: NextRequest) {
  console.log("---INCOMING /api/tournament REQUEST---");
  console.log("Request Headers:", Object.fromEntries(request.headers.entries()));
  console.log("------------------------------------");

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: CreateTournamentInput;
    try {
      body = (await request.json()) as CreateTournamentInput;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    // Basic presence validation mirrors helper but returns 400 instead of throwing 500
    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "prompt is required and must be a string" },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.models) || ![4, 8, 16].includes(body.models.length)) {
      return NextResponse.json(
        {
          success: false,
          error: "models must be an array of length 4, 8, or 16 matching bracketSize",
        },
        { status: 400 },
      );
    }
    if (!body.bracketSize || ![4, 8, 16].includes(body.bracketSize)) {
      return NextResponse.json(
        { success: false, error: "bracketSize must be 4, 8, or 16" },
        { status: 400 },
      );
    }
    if (body.models.length !== body.bracketSize) {
      return NextResponse.json(
        {
          success: false,
          error: "models length must equal bracketSize",
        },
        { status: 400 },
      );
    }
    if (!body.judgeModel || typeof body.judgeModel !== "string") {
      return NextResponse.json(
        { success: false, error: "judgeModel is required and must be a string" },
        { status: 400 },
      );
    }

    const { createTournament } = await import("@/lib/tournament-db");
    const newId = await createTournament(body, user.sub);
    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tournament";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
