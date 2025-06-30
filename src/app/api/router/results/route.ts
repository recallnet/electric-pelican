import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/privy";
import { saveExecutionResult } from "@/lib/router/result-persistence";

const SaveExecutionRequestSchema = z.object({
  executionId: z.string().min(5, "Invalid execution ID"),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validationResult = SaveExecutionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { executionId } = validationResult.data;

    // Get user ID from session (optional)
    let userId: string | undefined;
    try {
      const authUser = await getAuthenticatedUser(request);
      userId = authUser?.sub;
    } catch (error) {
      // User ID is optional, continue without it
      console.log("No authenticated user found, continuing without user ID");
    }

    // Always use real database persistence
    const result = await saveExecutionResult(executionId, userId);

    const duration = Date.now() - startTime;
    console.log(
      `[DATABASE] Result saved in ${duration}ms: ${result.success ? result.data?.resultId : "FAILED"}`,
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DATABASE] Result save failed in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save execution result",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/router/results",
    method: "POST",
    description: "Save router execution result (DATABASE MODE)",
    note: "Using real database persistence",
    requestSchema: {
      executionId: "string (required) - Execution ID to save",
    },
    responseSchema: {
      success: "boolean",
      data: {
        resultId: "string - Generated result ID",
        shareUrl: "string - Shareable URL path",
      },
    },
  });
}
