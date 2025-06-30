import { NextRequest, NextResponse } from "next/server";

import { ApiContracts } from "@/contracts/api";
import { updateEloScores } from "@/lib/elo";

/**
 * POST /api/internal/elo/update
 *
 * Internal API endpoint for updating ELO scores after tournament matches.
 * This endpoint is called by the tournament judging system when matches are completed.
 *
 * Note: This is an internal endpoint and should not be called directly by frontend.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const bodySchema = ApiContracts["POST /api/internal/elo/update"].request.body;
    const validatedBody = bodySchema.parse(body);

    const { tournamentRunId, roundNumber, winnerModelId, loserModelId } = validatedBody;

    // Validate that winner and loser are different
    if (winnerModelId === loserModelId) {
      return NextResponse.json(
        {
          success: false,
          error: "Winner and loser models cannot be the same",
        },
        { status: 400 },
      );
    }

    // Update ELO scores
    const updates = await updateEloScores({
      tournamentRunId,
      roundNumber,
      winnerModelId,
      loserModelId,
    });

    const response = {
      success: true,
      updates,
    };

    // Validate response against contract
    const responseSchema = ApiContracts["POST /api/internal/elo/update"].response;
    const validatedResponse = responseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("ELO update API error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: error.message,
        },
        { status: 400 },
      );
    }

    // Log the error for debugging but don't expose internal details
    const response = {
      success: false,
      error: "Failed to update ELO scores",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
