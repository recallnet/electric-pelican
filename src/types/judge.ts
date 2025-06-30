export interface JudgePromptRequest {
  challengePrompt: string;
}

export interface JudgePromptResponse {
  judgePrompt: string;
  success: boolean;
  error?: string;
}
