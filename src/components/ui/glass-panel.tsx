import React from "react";

import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Intensity of the glass effect */
  intensity?: "light" | "medium" | "heavy";
  /** Whether to include border */
  border?: boolean;
  /** Shadow elevation */
  elevation?: "e1" | "e2";
}

/**
 * Glass panel component following Savant design system.
 * Provides glassmorphic container with backdrop blur and subtle borders.
 */
export function GlassPanel({
  children,
  className,
  intensity = "medium",
  border = true,
  elevation = "e1",
  ...props
}: GlassPanelProps) {
  const intensityClasses = {
    light: "glassmorphism-25 backdrop-blur-sm",
    medium: "glassmorphism-50 backdrop-blur-md",
    heavy: "glassmorphism-75 backdrop-blur-lg",
  };

  return (
    <div
      className={cn(
        // Base glass effect
        intensityClasses[intensity],
        // Border and shadow
        border && "border border-white/20",
        `shadow-${elevation}`,
        // Rounded corners
        "rounded-lg",
        // Padding
        "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
