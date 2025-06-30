/**
 * @file Form-related component type definitions
 * @description Types for forms, inputs, and form validation components
 */

/** Props for judge prompt editor */
export interface JudgePromptEditorProps {
  /** The challenge prompt used to generate the judge prompt */
  challengePrompt: string;
  /** Callback when the judge prompt is finalized */
  onPromptChange?: ((judgePrompt: string) => void) | undefined;
  /** Initial judge prompt value */
  initialJudgePrompt?: string;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/** Props for prompt challenge form */
export interface PromptChallengeFormProps {
  /** Callback when a valid prompt is submitted */
  onSubmit?: ((data: { prompt: string; judgePrompt: string }) => void) | undefined;
  /** Optional initial prompt value */
  initialPrompt?: string;
  /** Optional initial judge prompt value */
  initialJudgePrompt?: string;
  /** Whether the form is in a loading state */
  loading?: boolean;
  /** Optional CSS class name */
  className?: string;
}
