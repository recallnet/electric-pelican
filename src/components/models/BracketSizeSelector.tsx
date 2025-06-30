"use client";

import { Button } from "@/components/ui/button";

export interface BracketSizeSelectorProps {
  /** Current bracket size */
  value: 4 | 8 | 16;
  /** Callback when bracket size changes */
  onChange: (size: 4 | 8 | 16) => void;
  /** Optional CSS class name */
  className?: string;
}

const BRACKET_SIZES = [4, 8] as const;

/**
 * Accessible bracket size selector for evaluation setup.
 * Allows choosing between 4, 8, or 16 model evaluation bracket.
 */
export function BracketSizeSelector({ value, onChange, className }: BracketSizeSelectorProps) {
  return (
    <div className={className}>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700">Evaluation Bracket Size</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Select evaluation bracket size">
          {BRACKET_SIZES.map((size) => (
            <Button
              key={size}
              type="button"
              variant={value === size ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(size)}
              role="radio"
              aria-checked={value === size}
              aria-label={`${size} model bracket`}
              className="min-w-[60px]"
            >
              {size}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selected: {value} models will compete in the evaluation
        </p>
      </fieldset>
    </div>
  );
}
