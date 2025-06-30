/**
 * @file Streaming connection management
 * @description Handles SSE connections, reconnection logic, and URL building
 */

import type { ExecutionEvent, StreamingPreferences } from "@/types/router";
import type { ConnectionState } from "@/types/streaming";

/**
 * Manages SSE connection lifecycle and reconnection logic
 */
export class ConnectionManager {
  private eventSource?: EventSource | undefined;
  private executionId: string;
  private preferences: StreamingPreferences;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private reconnectAttempts = 0;
  private connectionState: ConnectionState = "disconnected";
  private onConnectionStateChange?: ((state: ConnectionState) => void) | undefined;
  private onError?: ((error: Error) => void) | undefined;
  private reconnectTimer?: NodeJS.Timeout | undefined;

  public onEvent?: (event: ExecutionEvent) => void;

  constructor(
    executionId: string,
    preferences: StreamingPreferences,
    maxReconnectAttempts: number,
    reconnectDelay: number,
    onConnectionStateChange?: ((state: ConnectionState) => void) | undefined,
    onError?: ((error: Error) => void) | undefined,
  ) {
    this.executionId = executionId;
    this.preferences = preferences;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectDelay = reconnectDelay;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onError = onError;
  }

  connect(): void {
    if (this.connectionState === "connected" || this.connectionState === "connecting") {
      return;
    }

    this.setConnectionState("connecting");

    try {
      const url = this.buildStreamingUrl();
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnectionState("connected");
        console.log(`Connected to execution stream: ${this.executionId}`);
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        this.handleConnectionError();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const executionEvent: ExecutionEvent = JSON.parse(event.data);
          this.onEvent?.(executionEvent);
        } catch (error) {
          console.error("Error parsing SSE event:", error);
          this.onError?.(error as Error);
        }
      };
    } catch (error) {
      console.error("Error creating SSE connection:", error);
      this.onError?.(error as Error);
      this.setConnectionState("failed");
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    this.setConnectionState("disconnected");
    console.log(`Disconnected from execution stream: ${this.executionId}`);
  }

  updatePreferences(preferences: StreamingPreferences): void {
    this.preferences = preferences;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === "connected";
  }

  private buildStreamingUrl(): string {
    const baseUrl = `/api/router/execution/${this.executionId}/stream`;
    const params = new URLSearchParams();

    if (!this.preferences.includeIntermediateResults) {
      params.set("includeIntermediate", "false");
    }
    if (this.preferences.progressUpdateInterval !== 500) {
      params.set("progressInterval", this.preferences.progressUpdateInterval.toString());
    }
    if (this.preferences.maxResultLength !== 5000) {
      params.set("maxLength", this.preferences.maxResultLength.toString());
    }

    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }

  private handleConnectionError(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.setConnectionState("reconnecting");
      this.attemptReconnect();
    } else {
      this.setConnectionState("failed");
      const error = new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`);
      this.onError?.(error);
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.onConnectionStateChange?.(state);
    }
  }
}
