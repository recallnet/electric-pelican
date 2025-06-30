/**
 * @file Animated progress bar component
 * @description Smooth progress bar with status-based styling
 */

"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { ExecutionStatus } from "@/types/router";

/**
 * Props for AnimatedProgressBar component
 */
export interface AnimatedProgressBarProps {
  progress: number;
  status: ExecutionStatus;
  duration?: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Animated progress bar with smooth transitions
 */
export function AnimatedProgressBar({
  progress,
  status,
  duration = 1000,
  className,
  showLabel = true,
}: AnimatedProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress changes
  useEffect(() => {
    const startProgress = displayProgress;
    const targetProgress = Math.min(Math.max(progress, 0), 100);

    if (startProgress === targetProgress) return;

    let animationFrame: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      // Easing function (ease out cubic)
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easedProgress;

      setDisplayProgress(currentProgress);

      if (progressRatio < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [progress, duration, displayProgress]);

  // Get progress bar styling based on status
  const getProgressBarClasses = () => {
    const baseClasses = "h-2 rounded-full transition-all duration-300";

    switch (status) {
      case "running":
        return cn(baseClasses, "bg-blue-500 shadow-lg shadow-blue-500/20");
      case "completed":
        return cn(baseClasses, "bg-green-500 shadow-lg shadow-green-500/20");
      case "failed":
        return cn(baseClasses, "bg-red-500 shadow-lg shadow-red-500/20");
      case "cancelled":
        return cn(baseClasses, "bg-yellow-500 shadow-lg shadow-yellow-500/20");
      default:
        return cn(baseClasses, "bg-gray-300");
    }
  };

  const getTrackClasses = () => {
    const baseClasses = "w-full h-2 rounded-full overflow-hidden";

    switch (status) {
      case "running":
        return cn(baseClasses, "bg-blue-100 dark:bg-blue-900/20");
      case "completed":
        return cn(baseClasses, "bg-green-100 dark:bg-green-900/20");
      case "failed":
        return cn(baseClasses, "bg-red-100 dark:bg-red-900/20");
      case "cancelled":
        return cn(baseClasses, "bg-yellow-100 dark:bg-yellow-900/20");
      default:
        return cn(baseClasses, "bg-gray-100 dark:bg-gray-800");
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return "⚡";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "⏸️";
      default:
        return "⏳";
    }
  };

  const formatProgress = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className={cn("progress-container space-y-2", className)}>
      {/* Progress Track */}
      <div className={getTrackClasses()}>
        <div
          className={getProgressBarClasses()}
          style={{
            width: `${displayProgress}%`,
            transition: "width 0.3s ease-out",
          }}
        />
      </div>

      {/* Progress Label */}
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-base">{getStatusIcon()}</span>
            <span className="text-gray-600 dark:text-gray-400">
              {status === "running" && "In Progress"}
              {status === "completed" && "Complete"}
              {status === "failed" && "Failed"}
              {status === "cancelled" && "Cancelled"}
            </span>
          </div>

          <span className="font-mono text-gray-900 dark:text-gray-100">
            {formatProgress(displayProgress)}
          </span>
        </div>
      )}

      {/* Pulse animation for running state */}
      {status === "running" && (
        <style>
          {`
            @keyframes progress-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            .progress-container .bg-blue-500 {
              animation: progress-pulse 2s ease-in-out infinite;
            }
          `}
        </style>
      )}
    </div>
  );
}

/**
 * Simplified progress bar for inline use
 */
export function InlineProgressBar({
  progress,
  status,
  size = "sm",
  className,
}: {
  progress: number;
  status: ExecutionStatus;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizeClasses = {
    xs: "h-1",
    sm: "h-1.5",
    md: "h-2",
  };

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "completed":
        return "bg-gradient-to-r from-green-400 to-green-600";
      case "failed":
        return "bg-gradient-to-r from-red-400 to-red-600";
      case "cancelled":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className={cn(
        "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
        sizeClasses[size],
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", getStatusColor())}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  );
}
