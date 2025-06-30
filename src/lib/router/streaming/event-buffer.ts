/**
 * @file Event buffer system for Router-3B
 * @description Buffers events for reconnecting clients and handles event replay
 */

import type { BufferedEvent, ExecutionEvent } from "@/types/router";

/**
 * Event buffer for handling reconnections
 */
export class EventBuffer {
  private buffers: Map<string, BufferedEvent[]> = new Map();
  private maxBufferSize: number;
  private maxAge: number; // milliseconds

  constructor(maxBufferSize: number = 100, maxAge: number = 30 * 60 * 1000) {
    this.maxBufferSize = maxBufferSize;
    this.maxAge = maxAge; // 30 minutes default

    // Clean up old events every 5 minutes
    setInterval(
      () => {
        this.cleanupOldEvents();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Add event to buffer
   */
  addEvent(event: ExecutionEvent): void {
    if (!this.buffers.has(event.executionId)) {
      this.buffers.set(event.executionId, []);
    }

    const buffer = this.buffers.get(event.executionId)!;
    const bufferedEvent: BufferedEvent = {
      event,
      timestamp: Date.now(),
      retryCount: 0,
    };

    buffer.push(bufferedEvent);

    // Keep buffer size manageable
    if (buffer.length > this.maxBufferSize) {
      buffer.shift(); // Remove oldest event
    }
  }

  /**
   * Get buffered events since a specific timestamp
   */
  getBufferedEvents(executionId: string, since?: number): ExecutionEvent[] {
    const buffer = this.buffers.get(executionId) || [];
    const now = Date.now();

    return buffer
      .filter((bufferedEvent) => {
        // Filter by age
        if (now - bufferedEvent.timestamp > this.maxAge) {
          return false;
        }

        // Filter by timestamp if provided
        if (since && bufferedEvent.event.timestamp <= since) {
          return false;
        }

        return true;
      })
      .map((bufferedEvent) => bufferedEvent.event);
  }

  /**
   * Get all buffered events for an execution
   */
  getAllBufferedEvents(executionId: string): ExecutionEvent[] {
    return this.getBufferedEvents(executionId);
  }

  /**
   * Get recent events (last N events)
   */
  getRecentEvents(executionId: string, count: number = 10): ExecutionEvent[] {
    const buffer = this.buffers.get(executionId) || [];
    const recentBuffer = buffer.slice(-count);
    return recentBuffer.map((bufferedEvent) => bufferedEvent.event);
  }

  /**
   * Clear buffer for completed execution
   */
  clearBuffer(executionId: string): void {
    this.buffers.delete(executionId);
  }

  /**
   * Clean up old events across all buffers
   */
  private cleanupOldEvents(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const [executionId, buffer] of this.buffers.entries()) {
      const originalLength = buffer.length;

      // Remove events older than maxAge
      const filteredBuffer = buffer.filter(
        (bufferedEvent) => now - bufferedEvent.timestamp <= this.maxAge,
      );

      if (filteredBuffer.length === 0) {
        // Remove empty buffer
        this.buffers.delete(executionId);
      } else {
        this.buffers.set(executionId, filteredBuffer);
      }

      totalCleaned += originalLength - filteredBuffer.length;
    }

    if (totalCleaned > 0) {
      console.log(`Cleaned up ${totalCleaned} old buffered events`);
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    totalBuffers: number;
    totalEvents: number;
    bufferSizes: Record<string, number>;
    oldestEvent?: number;
    newestEvent?: number;
  } {
    const bufferSizes: Record<string, number> = {};
    let totalEvents = 0;
    let oldestEvent: number | undefined;
    let newestEvent: number | undefined;

    for (const [executionId, buffer] of this.buffers.entries()) {
      bufferSizes[executionId] = buffer.length;
      totalEvents += buffer.length;

      // Track oldest and newest events
      buffer.forEach((bufferedEvent) => {
        if (!oldestEvent || bufferedEvent.timestamp < oldestEvent) {
          oldestEvent = bufferedEvent.timestamp;
        }
        if (!newestEvent || bufferedEvent.timestamp > newestEvent) {
          newestEvent = bufferedEvent.timestamp;
        }
      });
    }

    return {
      totalBuffers: this.buffers.size,
      totalEvents,
      bufferSizes,
      ...(oldestEvent !== undefined && { oldestEvent }),
      ...(newestEvent !== undefined && { newestEvent }),
    };
  }

  /**
   * Replay events to a new connection
   */
  replayEvents(
    executionId: string,
    callback: (event: ExecutionEvent) => void,
    since?: number,
  ): number {
    const events = this.getBufferedEvents(executionId, since);

    events.forEach((event) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error replaying event:", error);
      }
    });

    return events.length;
  }

  /**
   * Mark events for retry (for failed deliveries)
   */
  markEventForRetry(executionId: string, eventTimestamp: number): void {
    const buffer = this.buffers.get(executionId);
    if (!buffer) return;

    const bufferedEvent = buffer.find((be) => be.event.timestamp === eventTimestamp);

    if (bufferedEvent) {
      bufferedEvent.retryCount++;
    }
  }

  /**
   * Get events that need retry
   */
  getRetryEvents(executionId: string, maxRetries: number = 3): ExecutionEvent[] {
    const buffer = this.buffers.get(executionId) || [];

    return buffer
      .filter(
        (bufferedEvent) => bufferedEvent.retryCount > 0 && bufferedEvent.retryCount <= maxRetries,
      )
      .map((bufferedEvent) => bufferedEvent.event);
  }

  /**
   * Remove events that have exceeded retry limit
   */
  removeFailedEvents(executionId: string, maxRetries: number = 3): number {
    const buffer = this.buffers.get(executionId);
    if (!buffer) return 0;

    const originalLength = buffer.length;
    const filteredBuffer = buffer.filter((bufferedEvent) => bufferedEvent.retryCount <= maxRetries);

    this.buffers.set(executionId, filteredBuffer);
    return originalLength - filteredBuffer.length;
  }
}

/**
 * Event compression utilities for large buffers
 */
export class EventCompressor {
  /**
   * Compress multiple progress events into summary
   */
  static compressProgressEvents(events: ExecutionEvent[]): ExecutionEvent[] {
    const compressed: ExecutionEvent[] = [];
    const progressGroups = new Map<string, ExecutionEvent[]>();

    // Group events by execution mode
    events.forEach((event) => {
      if (event.type === "progress") {
        const key = `${event.executionId}:${(event.data as any).executionMode}`;
        if (!progressGroups.has(key)) {
          progressGroups.set(key, []);
        }
        progressGroups.get(key)!.push(event);
      } else {
        compressed.push(event);
      }
    });

    // Keep only the latest progress event from each group
    progressGroups.forEach((progressEvents) => {
      if (progressEvents.length > 0) {
        const latest = progressEvents[progressEvents.length - 1];
        if (latest) {
          compressed.push(latest);
        }
      }
    });

    return compressed.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Summarize intermediate events for large workflows
   */
  static summarizeIntermediateEvents(events: ExecutionEvent[]): ExecutionEvent[] {
    const summarized: ExecutionEvent[] = [];
    const intermediateEvents: ExecutionEvent[] = [];

    events.forEach((event) => {
      if (event.type === "intermediate") {
        intermediateEvents.push(event);
      } else {
        summarized.push(event);
      }
    });

    // If we have many intermediate events, keep only key ones
    if (intermediateEvents.length > 10) {
      // Keep first, last, and every 5th event
      const keyEvents = intermediateEvents.filter(
        (_, index) => index === 0 || index === intermediateEvents.length - 1 || index % 5 === 0,
      );
      summarized.push(...keyEvents);
    } else {
      summarized.push(...intermediateEvents);
    }

    return summarized.sort((a, b) => a.timestamp - b.timestamp);
  }
}

/**
 * Global event buffer instance
 */
export const eventBuffer = new EventBuffer();
