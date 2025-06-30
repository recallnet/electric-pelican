/**
 * @file Router execution status API endpoint
 * @description GET /api/router/execution/[id]/status - Check execution status
 */

import { NextRequest, NextResponse } from "next/server";

import { getExecutionStatus } from "@/lib/router/execution-engine";

/**
 * GET /api/router/execution/[id]/status
 * Get execution status and progress
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();

  try {
    const { id: executionId } = await params;

    if (!executionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Execution ID is required",
        },
        { status: 400 },
      );
    }

    // Get execution status
    const status = getExecutionStatus(executionId);

    const duration = Date.now() - startTime;
    console.log(`Status check completed in ${duration}ms for execution: ${executionId}`);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Status check failed in ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Check if it's a "not found" error
    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Execution not found",
          message: errorMessage,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get execution status",
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
