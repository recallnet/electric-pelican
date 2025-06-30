/**
 * @file Connection manager for Router-3B
 * @description Manages client connections and handles event broadcasting with preferences
 */

import type {
  ClientConnection,
  ExecutionEvent,
  StreamHandler,
  StreamingPreferences,
} from "@/types/router";

import { EventFilter, eventRateLimit } from "./event-bus";

/**
 * Default streaming preferences
 */
const DEFAULT_PREFERENCES: StreamingPreferences = {
  includeIntermediateResults: true,
  progressUpdateInterval: 500, // 500ms
  maxResultLength: 5000, // 5KB
};

/**
 * Connection manager for handling client connections
 */
export class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private handlers: Map<string, StreamHandler> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up stale connections every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000);
  }

  /**
   * Add a new client connection
   */
  addConnection(connection: ClientConnection, handler: StreamHandler): void {
    this.connections.set(connection.connectionId, connection);
    this.handlers.set(connection.connectionId, handler);

    console.log(
      `New ${connection.connectionType} connection: ${connection.connectionId} for execution: ${connection.executionId}`,
    );
  }

  /**
   * Remove a client connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      console.log(`Removing connection: ${connectionId} for execution: ${connection.executionId}`);

      // Clean up rate limiting
      eventRateLimit.cleanup(connection.executionId);
    }

    this.connections.delete(connectionId);
    this.handlers.delete(connectionId);
  }

  /**
   * Get all connections for a specific execution
   */
  getConnectionsForExecution(executionId: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter((conn) => conn.executionId === executionId);
  }

  /**
   * Broadcast event to all connections for an execution
   */
  broadcastToExecution(executionId: string, event: ExecutionEvent): void {
    const connections = this.getConnectionsForExecution(executionId);

    connections.forEach((connection) => {
      try {
        this.sendEventToConnection(connection, event);
      } catch (error) {
        console.error(`Failed to send event to connection ${connection.connectionId}:`, error);
        // Remove failed connection
        this.removeConnection(connection.connectionId);
      }
    });
  }

  /**
   * Send event to a specific connection with filtering and rate limiting
   */
  private sendEventToConnection(connection: ClientConnection, event: ExecutionEvent): void {
    // Check rate limiting
    if (!eventRateLimit.shouldEmit(connection.executionId, event.type, connection.preferences)) {
      return;
    }

    // Check if event should be sent based on preferences
    if (!EventFilter.shouldSendEvent(event, connection.preferences)) {
      return;
    }

    // Process event for client (truncate if needed)
    const processedEvent = EventFilter.processEventForClient(event, connection.preferences);

    // Get handler and send event
    const handler = this.handlers.get(connection.connectionId);
    if (handler) {
      handler.send(processedEvent);

      // Update last seen time
      connection.lastSeen = Date.now();
    }
  }

  /**
   * Update connection preferences
   */
  updateConnectionPreferences(
    connectionId: string,
    preferences: Partial<StreamingPreferences>,
  ): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.preferences = { ...connection.preferences, ...preferences };
    }
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    const staleConnections = Array.from(this.connections.values()).filter(
      (conn) => now - conn.lastSeen > staleThreshold,
    );

    staleConnections.forEach((conn) => {
      console.log(`Cleaning up stale connection: ${conn.connectionId}`);
      this.removeConnection(conn.connectionId);
    });

    if (staleConnections.length > 0) {
      console.log(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByType: Record<string, number>;
    connectionsByExecution: Record<string, number>;
  } {
    const connections = Array.from(this.connections.values());

    const connectionsByType = connections.reduce(
      (acc, conn) => {
        acc[conn.connectionType] = (acc[conn.connectionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const connectionsByExecution = connections.reduce(
      (acc, conn) => {
        acc[conn.executionId] = (acc[conn.executionId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalConnections: connections.length,
      connectionsByType,
      connectionsByExecution,
    };
  }

  /**
   * Close all connections for an execution
   */
  closeExecutionConnections(executionId: string): void {
    const connections = this.getConnectionsForExecution(executionId);

    connections.forEach((connection) => {
      const handler = this.handlers.get(connection.connectionId);
      if (handler) {
        try {
          handler.close();
        } catch (error) {
          console.error(`Error closing connection ${connection.connectionId}:`, error);
        }
      }
      this.removeConnection(connection.connectionId);
    });

    console.log(`Closed ${connections.length} connections for execution: ${executionId}`);
  }

  /**
   * Destroy the connection manager
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);

    // Close all connections
    Array.from(this.connections.keys()).forEach((connectionId) => {
      this.removeConnection(connectionId);
    });
  }
}

/**
 * Parse streaming preferences from URL parameters
 */
export function parseStreamingPreferences(url: string): StreamingPreferences {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;

  return {
    includeIntermediateResults: params.get("includeIntermediate") !== "false",
    progressUpdateInterval: parseInt(params.get("progressInterval") || "500", 10),
    maxResultLength: parseInt(params.get("maxLength") || "5000", 10),
  };
}

/**
 * Generate unique connection ID
 */
export function generateConnectionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `conn_${timestamp}_${random}`;
}

/**
 * Validate streaming preferences
 */
export function validateStreamingPreferences(
  preferences: Partial<StreamingPreferences>,
): StreamingPreferences {
  return {
    includeIntermediateResults:
      preferences.includeIntermediateResults ?? DEFAULT_PREFERENCES.includeIntermediateResults,
    progressUpdateInterval: Math.max(
      100,
      Math.min(
        5000,
        preferences.progressUpdateInterval ?? DEFAULT_PREFERENCES.progressUpdateInterval,
      ),
    ),
    maxResultLength: Math.max(
      100,
      Math.min(50000, preferences.maxResultLength ?? DEFAULT_PREFERENCES.maxResultLength),
    ),
  };
}

/**
 * Global connection manager instance
 */
export const connectionManager = new ConnectionManager();
