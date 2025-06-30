/**
 * @file Time formatting utilities for router execution progress
 * @description Provides consistent time formatting across progress displays
 */

/**
 * Format milliseconds to human-readable time string
 */
export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  const seconds = milliseconds / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format time for duration display (more precise)
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 100) {
    return `${Math.round(milliseconds)}ms`;
  }

  if (milliseconds < 10000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }

  return formatTime(milliseconds);
}

/**
 * Format estimated time remaining
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds < 5000) {
    return "finishing up...";
  }

  return `~${formatTime(milliseconds)} remaining`;
}

/**
 * Get relative time string (e.g., "2 minutes ago")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) {
    return "just now";
  }

  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(diff / 3600000);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

/**
 * Format execution rate (tokens/second, steps/minute, etc.)
 */
export function formatRate(
  value: number,
  unit: string,
  timeUnit: "second" | "minute" = "second",
): string {
  if (value < 1) {
    return `<1 ${unit}/${timeUnit}`;
  }

  if (value < 10) {
    return `${value.toFixed(1)} ${unit}/${timeUnit}`;
  }

  return `${Math.round(value)} ${unit}/${timeUnit}`;
}
