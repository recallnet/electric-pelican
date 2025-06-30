/**
 * @file Core streaming client implementation
 * @description Main StreamingClient class with connection and event handling
 */

import type { StreamingPreferences } from "@/types/router";
import type {
  ConnectionState,
  StreamingClientOptions,
  StreamingEventHandler,
} from "@/types/streaming";

import { ConnectionManager } from "./connection";
import { EventManager } from "./events";

/**
 * Default streaming preferences for clients
 */
const DEFAULT_CLIENT_PREFERENCES: StreamingPreferences = {
  includeIntermediateResults: true,
  progressUpdateInterval: 500,
  maxResultLength: 5000,
};

/**
 * Server-Sent Events streaming client
 */
export class StreamingClient {
  private connectionManager: ConnectionManager;
  private eventManager: EventManager;
  private preferences: StreamingPreferences;

  constructor(executionId: string, options: StreamingClientOptions = {}) {
    this.preferences = { ...DEFAULT_CLIENT_PREFERENCES, ...options.preferences };

    this.connectionManager = new ConnectionManager(
      executionId,
      this.preferences,
      options.maxReconnectAttempts || 5,
      options.reconnectDelay || 1000,
      options.onConnectionStateChange,
      options.onError,
    );

    this.eventManager = new EventManager();

    // Set up event handling from connection manager
    this.connectionManager.onEvent = (event) => {
      this.eventManager.handleExecutionEvent(event);
    };
  }

  /**
   * Connect to the streaming endpoint
   */
  connect(): void {
    this.connectionManager.connect();
  }

  /**
   * Disconnect from the streaming endpoint
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }

  /**
   * Add event handler for specific event types
   */
  addEventListener(eventType: string, handler: StreamingEventHandler): void {
    this.eventManager.addEventListener(eventType, handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(eventType: string, handler: StreamingEventHandler): void {
    this.eventManager.removeEventListener(eventType, handler);
  }

  /**
   * Add global event handler for all events
   */
  addGlobalEventListener(handler: StreamingEventHandler): void {
    this.eventManager.addGlobalEventListener(handler);
  }

  /**
   * Remove global event handler
   */
  removeGlobalEventListener(handler: StreamingEventHandler): void {
    this.eventManager.removeGlobalEventListener(handler);
  }

  /**
   * Update streaming preferences
   */
  updatePreferences(preferences: Partial<StreamingPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.connectionManager.updatePreferences(this.preferences);

    // Reconnect with new preferences if currently connected
    if (this.connectionManager.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionManager.getConnectionState();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  /**
   * Get current preferences
   */
  getPreferences(): StreamingPreferences {
    return { ...this.preferences };
  }
}
