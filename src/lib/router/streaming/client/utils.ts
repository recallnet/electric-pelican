/**
 * @file Streaming utilities
 * @description Helper functions and utilities for streaming clients
 */

import type { ExecutionEvent } from "@/types/router";
import type { ConnectionState, StreamingClientOptions } from "@/types/streaming";

import { StreamingClient } from "./core";

/**
 * Utility functions for streaming clients
 */
export class StreamingUtils {
  /**
   * Create a streaming client with common event handlers
   */
  static createClient(
    executionId: string,
    handlers: {
      onProgress?: (data: any) => void;
      onIntermediate?: (data: any) => void;
      onComplete?: (data: any) => void;
      onError?: (data: any) => void;
      onConnectionChange?: (state: ConnectionState) => void;
    },
    options?: StreamingClientOptions,
  ): StreamingClient {
    const client = new StreamingClient(executionId, {
      ...options,
      onConnectionStateChange: handlers.onConnectionChange,
    });

    if (handlers.onProgress) {
      client.addEventListener("progress", (event) => {
        handlers.onProgress!(event.data);
      });
    }

    if (handlers.onIntermediate) {
      client.addEventListener("intermediate", (event) => {
        handlers.onIntermediate!(event.data);
      });
    }

    if (handlers.onComplete) {
      client.addEventListener("complete", (event) => {
        handlers.onComplete!(event.data);
      });
    }

    if (handlers.onError) {
      client.addEventListener("error", (event) => {
        handlers.onError!(event.data);
      });
    }

    return client;
  }

  /**
   * Format execution event for display
   */
  static formatEventForDisplay(event: ExecutionEvent): string {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();

    switch (event.type) {
      case "progress": {
        const progress = event.data as any;
        return `[${timestamp}] Progress: ${progress.progressPercentage}% - ${progress.stepDescription}`;
      }

      case "intermediate": {
        const intermediate = event.data as any;
        return `[${timestamp}] Step ${intermediate.stepId} completed (${intermediate.modelId})`;
      }

      case "complete": {
        const complete = event.data as any;
        return `[${timestamp}] Execution completed in ${complete.totalExecutionTime}ms`;
      }

      case "error": {
        const error = event.data as any;
        return `[${timestamp}] Error: ${error.errorMessage}`;
      }

      default:
        return `[${timestamp}] ${event.type}: ${JSON.stringify(event.data)}`;
    }
  }

  /**
   * Calculate progress percentage from event
   */
  static getProgressPercentage(event: ExecutionEvent): number {
    if (event.type === "progress") {
      return (event.data as any).progressPercentage || 0;
    }
    if (event.type === "complete") {
      return 100;
    }
    return 0;
  }

  /**
   * Check if event indicates execution completion
   */
  static isExecutionComplete(event: ExecutionEvent): boolean {
    return event.type === "complete" || event.type === "error";
  }

  /**
   * Extract model information from event
   */
  static getModelInfo(event: ExecutionEvent): { modelId?: string; modelName?: string } {
    const data = event.data as any;
    return {
      modelId: data.modelId,
      modelName: data.modelName,
    };
  }
}
