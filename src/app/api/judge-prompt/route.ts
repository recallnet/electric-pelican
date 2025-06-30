import { NextRequest, NextResponse } from "next/server";

import { generateJudgePrompt } from "@/lib/judge-prompt";
import { JudgePromptRequest, JudgePromptResponse } from "@/types/judge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: JudgePromptRequest = await request.json();

    if (!body.challengePrompt || typeof body.challengePrompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "challengePrompt is required and must be a string",
          judgePrompt: "",
        } satisfies JudgePromptResponse,
        { status: 400 },
      );
    }

    const judgePrompt = await generateJudgePrompt(body.challengePrompt);

    return NextResponse.json({
      success: true,
      judgePrompt,
    } satisfies JudgePromptResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate judge prompt";

    return NextResponse.json(
      {
        success: false,
        error: message,
        judgePrompt: "",
      } satisfies JudgePromptResponse,
      { status: 500 },
    );
  }
}
