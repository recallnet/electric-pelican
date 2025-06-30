import { NextRequest, NextResponse } from "next/server";

import { getExecutionResult } from "@/lib/router/result-persistence";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();

  try {
    const { id } = await params;

    if (!id || id.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid result ID",
        },
        { status: 400 },
      );
    }

    // Always use real database persistence
    const result = await getExecutionResult(id);

    const duration = Date.now() - startTime;
    console.log(
      `[DATABASE] Result fetched in ${duration}ms: ${id} - ${result.success ? "SUCCESS" : "NOT_FOUND"}`,
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.data === null ? 404 : 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DATABASE] Result fetch failed in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch execution result",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
