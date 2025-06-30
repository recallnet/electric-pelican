/**
 * @file Simple ScrollArea component
 * @description Basic scrollable area for content overflow
 */

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Props for ScrollArea component
 */
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * ScrollArea component with custom styling
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
          "dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
