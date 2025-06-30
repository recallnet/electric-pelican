/**
 * @file Challenge generation button component
 * @description Button component for generating AI challenge prompts
 */

import { Button } from "@/components/ui/button";

interface GenerationButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

/**
 * Button component for generating AI challenge prompts
 */
export function GenerationButton({ onClick, isLoading, disabled }: GenerationButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="text-xs"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
          Generating...
        </>
      ) : (
        <>✨ Generate Challenge</>
      )}
    </Button>
  );
}
