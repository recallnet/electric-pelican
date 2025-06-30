/**
 * @file Streaming event management
 * @description Handles event processing and handler management
 */

import type { ExecutionEvent } from "@/types/router";
import type { StreamingEventHandler } from "@/types/streaming";

/**
 * Manages event handlers and event processing
 */
export class EventManager {
  private eventHandlers: Map<string, Set<StreamingEventHandler>> = new Map();

  /**
   * Add event handler for specific event types
   */
  addEventListener(eventType: string, handler: StreamingEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(eventType: string, handler: StreamingEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  /**
   * Add global event handler for all events
   */
  addGlobalEventListener(handler: StreamingEventHandler): void {
    this.addEventListener("*", handler);
  }

  /**
   * Remove global event handler
   */
  removeGlobalEventListener(handler: StreamingEventHandler): void {
    this.removeEventListener("*", handler);
  }

  /**
   * Handle incoming execution events
   */
  handleExecutionEvent(event: ExecutionEvent): void {
    // Emit to specific event type handlers
    const typeHandlers = this.eventHandlers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in ${event.type} event handler:`, error);
        }
      });
    }

    // Emit to global handlers
    const globalHandlers = this.eventHandlers.get("*");
    if (globalHandlers) {
      globalHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in global event handler:", error);
        }
      });
    }
  }
}
