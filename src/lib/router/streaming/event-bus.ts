/**
 * @file Event bus system for Router-3B
 * @description Distributes execution events to connected clients with filtering and buffering
 */

import type { EventListener, ExecutionEvent, StreamingPreferences } from "@/types/router";

/**
 * Event bus for distributing execution events
 */
export class ExecutionEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();

  /**
   * Add listener for specific execution
   */
  addListener(executionId: string, listener: EventListener): void {
    if (!this.listeners.has(executionId)) {
      this.listeners.set(executionId, new Set());
    }
    this.listeners.get(executionId)!.add(listener);
  }

  /**
   * Add global listener for all executions
   */
  addGlobalListener(listener: EventListener): void {
    this.globalListeners.add(listener);
  }

  /**
   * Remove listener for specific execution
   */
  removeListener(executionId: string, listener: EventListener): void {
    const listeners = this.listeners.get(executionId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(executionId);
      }
    }
  }

  /**
   * Remove global listener
   */
  removeGlobalListener(listener: EventListener): void {
    this.globalListeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  emit(event: ExecutionEvent): void {
    // Emit to execution-specific listeners
    const listeners = this.listeners.get(event.executionId);
    if (listeners) {
      this.broadcastToListeners(listeners, event);
    }

    // Emit to global listeners
    this.broadcastToListeners(this.globalListeners, event);
  }

  /**
   * Broadcast event to a set of listeners
   */
  private broadcastToListeners(listeners: Set<EventListener>, event: ExecutionEvent): void {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
        // Don't remove listener on error - let connection manager handle it
      }
    });
  }

  /**
   * Clean up listeners for completed execution
   */
  cleanup(executionId: string): void {
    this.listeners.delete(executionId);
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(executionId?: string): number {
    if (executionId) {
      return this.listeners.get(executionId)?.size || 0;
    }
    return (
      Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0) +
      this.globalListeners.size
    );
  }

  /**
   * Get all active execution IDs
   */
  getActiveExecutions(): string[] {
    return Array.from(this.listeners.keys());
  }
}

/**
 * Event filtering utilities
 */
export class EventFilter {
  /**
   * Filter event based on client preferences
   */
  static shouldSendEvent(event: ExecutionEvent, preferences: StreamingPreferences): boolean {
    // Always send progress, complete, error, and connection events
    if (["progress", "complete", "error", "connected", "cancelled"].includes(event.type)) {
      return true;
    }

    // Filter intermediate results based on preferences
    if (event.type === "intermediate") {
      return preferences.includeIntermediateResults;
    }

    return true;
  }

  /**
   * Truncate event data based on preferences
   */
  static processEventForClient(
    event: ExecutionEvent,
    preferences: StreamingPreferences,
  ): ExecutionEvent {
    // Clone event to avoid modifying original
    const processedEvent = { ...event };

    // Truncate long results if needed
    if (event.type === "intermediate" && "result" in event.data) {
      const data = event.data as any;
      if (data.result && data.result.length > preferences.maxResultLength) {
        processedEvent.data = {
          ...data,
          result: data.result.substring(0, preferences.maxResultLength) + "...",
          truncated: true,
        };
      }
    }

    if (event.type === "complete" && "finalResult" in event.data) {
      const data = event.data as any;
      if (data.finalResult && data.finalResult.length > preferences.maxResultLength) {
        processedEvent.data = {
          ...data,
          finalResult: data.finalResult.substring(0, preferences.maxResultLength) + "...",
          truncated: true,
        };
      }
    }

    return processedEvent;
  }
}

/**
 * Rate limiting for event emission
 */
export class EventRateLimit {
  private lastEmission: Map<string, number> = new Map();

  /**
   * Check if event should be emitted based on rate limiting
   */
  shouldEmit(executionId: string, eventType: string, preferences: StreamingPreferences): boolean {
    // No rate limiting for critical events
    if (["complete", "error", "cancelled"].includes(eventType)) {
      return true;
    }

    // Rate limit progress events
    if (eventType === "progress") {
      const key = `${executionId}:${eventType}`;
      const now = Date.now();
      const lastTime = this.lastEmission.get(key) || 0;

      if (now - lastTime >= preferences.progressUpdateInterval) {
        this.lastEmission.set(key, now);
        return true;
      }
      return false;
    }

    // No rate limiting for intermediate results
    return true;
  }

  /**
   * Clean up rate limiting data for completed execution
   */
  cleanup(executionId: string): void {
    const keysToDelete = Array.from(this.lastEmission.keys()).filter((key) =>
      key.startsWith(`${executionId}:`),
    );

    keysToDelete.forEach((key) => this.lastEmission.delete(key));
  }
}

/**
 * Global event bus instance
 */
export const executionEventBus = new ExecutionEventBus();

/**
 * Global event filter instance
 */
export const eventFilter = new EventFilter();

/**
 * Global rate limiter instance
 */
export const eventRateLimit = new EventRateLimit();
