/**
 * Types for logging functionality
 */

/**
 * Structure of a development log entry
 */
export interface DevLogEntry {
  /** ISO timestamp of when the log entry was created */
  timestamp: string;

  /** Log level */
  level: "info" | "debug" | "error";

  /** Type of log entry */
  type: string;

  /** Component or module that generated the log */
  component: string;

  /** Additional details (can be any type) */
  details?: unknown;

  /** Log message */
  message: string;
}
