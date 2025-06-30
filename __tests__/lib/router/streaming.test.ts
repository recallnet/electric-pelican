// @ts-nocheck
/**
 * @file Router-3B Streaming Tests
 * @description Comprehensive tests for the streaming system
 */

// @ts-ignore - Module resolution works in Jest but not in tsc
import { ExecutionEventBus, EventFilter } from "@/lib/router/streaming/event-bus";
import {
  ConnectionManager,
  generateConnectionId,
  parseStreamingPreferences,
  validateStreamingPreferences,
  // @ts-ignore - Module resolution works in Jest but not in tsc
} from "@/lib/router/streaming/connection-manager";
// @ts-ignore - Module resolution works in Jest but not in tsc
import { EventBuffer, EventCompressor } from "@/lib/router/streaming/event-buffer";
import {
  RouterExecutionEventEmitter,
  setupExecutionStreaming,
  ExecutionEventUtils,
  // @ts-ignore - Module resolution works in Jest but not in tsc
} from "@/lib/router/execution-events";
// @ts-ignore - Module resolution works in Jest but not in tsc
import { StreamingClient, StreamingUtils } from "@/lib/router/streaming/client";
import type {
  ClientConnection,
  ExecutionEvent,
  StreamHandler,
  StreamingPreferences,
  // @ts-ignore - Module resolution works in Jest but not in tsc
} from "@/types/router";

describe("Router-3B Streaming System", () => {
  describe("ExecutionEventBus", () => {
    let eventBus: ExecutionEventBus;

    beforeEach(() => {
      eventBus = new ExecutionEventBus();
    });

    it("should add and remove listeners for specific executions", () => {
      const executionId = "test-execution";
      const listener = jest.fn();

      eventBus.addListener(executionId, listener);
      expect(eventBus.getListenerCount(executionId)).toBe(1);

      eventBus.removeListener(executionId, listener);
      expect(eventBus.getListenerCount(executionId)).toBe(0);
    });

    it("should emit events to correct listeners", () => {
      const executionId1 = "test-execution-1";
      const executionId2 = "test-execution-2";
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      eventBus.addListener(executionId1, listener1);
      eventBus.addListener(executionId2, listener2);

      const event: ExecutionEvent = {
        type: "progress",
        executionId: executionId1,
        timestamp: Date.now(),
        data: {
          executionMode: "single",
          currentStep: 1,
          totalSteps: 1,
          stepDescription: "Test step",
          modelId: "test-model",
          estimatedTimeRemaining: 1000,
          progressPercentage: 50,
        },
      };

      eventBus.emit(event);

      expect(listener1).toHaveBeenCalledWith(event);
      expect(listener2).not.toHaveBeenCalled();
    });

    it("should handle global listeners", () => {
      const globalListener = jest.fn();
      const executionId = "test-execution";

      eventBus.addGlobalListener(globalListener);

      const event: ExecutionEvent = {
        type: "complete",
        executionId,
        timestamp: Date.now(),
        data: {
          executionMode: "workflow",
          finalResult: "Test result",
          totalExecutionTime: 5000,
          totalTokensUsed: 100,
          totalCost: 0.01,
          stepsCompleted: 3,
          modelUsage: [],
        },
      };

      eventBus.emit(event);

      expect(globalListener).toHaveBeenCalledWith(event);
    });

    it("should clean up listeners for completed executions", () => {
      const executionId = "test-execution";
      const listener = jest.fn();

      eventBus.addListener(executionId, listener);
      expect(eventBus.getListenerCount(executionId)).toBe(1);

      eventBus.cleanup(executionId);
      expect(eventBus.getListenerCount(executionId)).toBe(0);
    });
  });

  describe("EventFilter", () => {
    const preferences: StreamingPreferences = {
      includeIntermediateResults: true,
      progressUpdateInterval: 500,
      maxResultLength: 1000,
    };

    it("should filter events based on preferences", () => {
      const progressEvent: ExecutionEvent = {
        type: "progress",
        executionId: "test",
        timestamp: Date.now(),
        data: { executionMode: "single" } as any,
      };

      const intermediateEvent: ExecutionEvent = {
        type: "intermediate",
        executionId: "test",
        timestamp: Date.now(),
        data: { result: "test result" } as any,
      };

      expect(EventFilter.shouldSendEvent(progressEvent, preferences)).toBe(true);
      expect(EventFilter.shouldSendEvent(intermediateEvent, preferences)).toBe(true);

      const noIntermediatePrefs = { ...preferences, includeIntermediateResults: false };
      expect(EventFilter.shouldSendEvent(intermediateEvent, noIntermediatePrefs)).toBe(false);
    });

    it("should truncate long results", () => {
      const longResult = "x".repeat(2000);
      const event: ExecutionEvent = {
        type: "intermediate",
        executionId: "test",
        timestamp: Date.now(),
        data: { result: longResult } as any,
      };

      const processed = EventFilter.processEventForClient(event, preferences);
      expect((processed.data as any).result).toHaveLength(1003); // 1000 + '...'
      expect((processed.data as any).truncated).toBe(true);
    });
  });

  describe("EventBuffer", () => {
    let eventBuffer: EventBuffer;

    beforeEach(() => {
      eventBuffer = new EventBuffer(10, 60000); // 10 events, 1 minute
    });

    it("should buffer events for executions", () => {
      const executionId = "test-execution";
      const event: ExecutionEvent = {
        type: "progress",
        executionId,
        timestamp: Date.now(),
        data: {} as any,
      };

      eventBuffer.addEvent(event);

      const bufferedEvents = eventBuffer.getAllBufferedEvents(executionId);
      expect(bufferedEvents).toHaveLength(1);
      expect(bufferedEvents[0]).toEqual(event);
    });

    it("should replay events since a timestamp", () => {
      const executionId = "test-execution";
      const now = Date.now();

      const event1: ExecutionEvent = {
        type: "progress",
        executionId,
        timestamp: now - 2000,
        data: {} as any,
      };

      const event2: ExecutionEvent = {
        type: "progress",
        executionId,
        timestamp: now - 1000,
        data: {} as any,
      };

      eventBuffer.addEvent(event1);
      eventBuffer.addEvent(event2);

      const recentEvents = eventBuffer.getBufferedEvents(executionId, now - 1500);
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0]).toEqual(event2);
    });

    it("should limit buffer size", () => {
      const executionId = "test-execution";

      // Add more events than buffer size
      for (let i = 0; i < 15; i++) {
        const event: ExecutionEvent = {
          type: "progress",
          executionId,
          timestamp: Date.now() + i,
          data: {} as any,
        };
        eventBuffer.addEvent(event);
      }

      const bufferedEvents = eventBuffer.getAllBufferedEvents(executionId);
      expect(bufferedEvents).toHaveLength(10); // Should be limited to buffer size
    });
  });

  describe("ConnectionManager", () => {
    let connectionManager: ConnectionManager;

    beforeEach(() => {
      connectionManager = new ConnectionManager();
    });

    afterEach(() => {
      connectionManager.destroy();
    });

    it("should manage client connections", () => {
      const connectionId = generateConnectionId();
      const executionId = "test-execution";

      const connection: ClientConnection = {
        connectionId,
        executionId,
        connectionType: "sse",
        lastSeen: Date.now(),
        preferences: {
          includeIntermediateResults: true,
          progressUpdateInterval: 500,
          maxResultLength: 5000,
        },
      };

      const handler: StreamHandler = {
        connectionId,
        send: jest.fn(),
        close: jest.fn(),
      };

      connectionManager.addConnection(connection, handler);

      const connections = connectionManager.getConnectionsForExecution(executionId);
      expect(connections).toHaveLength(1);
      expect(connections[0]).toEqual(connection);
    });

    it("should broadcast events to execution connections", () => {
      const connectionId = generateConnectionId();
      const executionId = "test-execution";

      const connection: ClientConnection = {
        connectionId,
        executionId,
        connectionType: "sse",
        lastSeen: Date.now(),
        preferences: {
          includeIntermediateResults: true,
          progressUpdateInterval: 500,
          maxResultLength: 5000,
        },
      };

      const sendMock = jest.fn();
      const handler: StreamHandler = {
        connectionId,
        send: sendMock,
        close: jest.fn(),
      };

      connectionManager.addConnection(connection, handler);

      const event: ExecutionEvent = {
        type: "progress",
        executionId,
        timestamp: Date.now(),
        data: {
          executionMode: "single",
          currentStep: 1,
          totalSteps: 1,
          stepDescription: "Test",
          modelId: "test-model",
          estimatedTimeRemaining: 1000,
          progressPercentage: 50,
        },
      };

      connectionManager.broadcastToExecution(executionId, event);

      expect(sendMock).toHaveBeenCalledWith(event);
    });
  });

  describe("RouterExecutionEventEmitter", () => {
    let eventEmitter: RouterExecutionEventEmitter;
    const executionId = "test-execution";

    beforeEach(() => {
      eventEmitter = new RouterExecutionEventEmitter(executionId);
    });

    it("should emit progress events", () => {
      const progressData = ExecutionEventUtils.createProgressData(
        "single",
        1,
        1,
        "Test step",
        "test-model",
        1000,
      );

      // Mock the event emission
      const emitSpy = jest.spyOn(eventEmitter as any, "emitEvent");

      eventEmitter.emitProgress(executionId, "single", progressData);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "progress",
          executionId,
          data: progressData,
        }),
      );
    });

    it("should emit intermediate result events", () => {
      const intermediateData = ExecutionEventUtils.createIntermediateData(
        "step-1",
        "test-model",
        "Test result",
        1000,
        50,
        0.01,
        "workflow",
      );

      const emitSpy = jest.spyOn(eventEmitter as any, "emitEvent");

      eventEmitter.emitIntermediate(executionId, "workflow", intermediateData);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "intermediate",
          executionId,
          data: intermediateData,
        }),
      );
    });

    it("should emit completion events", () => {
      const completionData = ExecutionEventUtils.createCompletionData(
        "single",
        "Final result",
        5000,
        100,
        0.05,
        1,
        [],
      );

      const emitSpy = jest.spyOn(eventEmitter as any, "emitEvent");

      eventEmitter.emitComplete(executionId, "single", completionData);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "complete",
          executionId,
          data: completionData,
        }),
      );
    });
  });

  describe("StreamingClient", () => {
    let client: StreamingClient;
    const executionId = "test-execution";

    beforeEach(() => {
      client = new StreamingClient(executionId);
    });

    afterEach(() => {
      client.disconnect();
    });

    it("should manage connection state", () => {
      expect(client.getConnectionState()).toBe("disconnected");
      expect(client.isConnected()).toBe(false);
    });

    it("should manage event listeners", () => {
      const executionId = "test-execution";
      const progressHandler = jest.fn();
      const globalHandler = jest.fn();

      // Use the correct API methods
      client.addEventListener("progress", progressHandler);
      client.addGlobalEventListener(globalHandler);

      // Simulate event handling by triggering the event bus directly
      const event: ExecutionEvent = {
        type: "progress",
        executionId,
        timestamp: Date.now(),
        data: {} as any,
      };

      // Access the event manager and trigger event handling
      const eventManager = (client as any).eventManager;
      if (eventManager && eventManager.handleExecutionEvent) {
        eventManager.handleExecutionEvent(event);
      }

      expect(progressHandler).toHaveBeenCalledWith(event);
      expect(globalHandler).toHaveBeenCalledWith(event);
    });

    it("should update preferences", () => {
      const newPrefs = { maxResultLength: 10000 };
      client.updatePreferences(newPrefs);

      const preferences = client.getPreferences();
      expect(preferences.maxResultLength).toBe(10000);
    });
  });

  describe("Utility Functions", () => {
    it("should generate unique connection IDs", () => {
      const id1 = generateConnectionId();
      const id2 = generateConnectionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^conn_/);
      expect(id2).toMatch(/^conn_/);
    });

    it("should parse streaming preferences from URL", () => {
      const url =
        "http://example.com/stream?includeIntermediate=false&progressInterval=1000&maxLength=2000";
      const preferences = parseStreamingPreferences(url);

      expect(preferences.includeIntermediateResults).toBe(false);
      expect(preferences.progressUpdateInterval).toBe(1000);
      expect(preferences.maxResultLength).toBe(2000);
    });

    it("should validate streaming preferences", () => {
      const invalidPrefs = {
        progressUpdateInterval: 50, // Too low
        maxResultLength: 50000000, // Too high
      };

      const validated = validateStreamingPreferences(invalidPrefs);

      expect(validated.progressUpdateInterval).toBe(100); // Clamped to minimum
      expect(validated.maxResultLength).toBe(50000); // Clamped to maximum
    });

    it("should format events for display", () => {
      const progressEvent: ExecutionEvent = {
        type: "progress",
        executionId: "test",
        timestamp: Date.now(),
        data: {
          progressPercentage: 75,
          stepDescription: "Processing data",
        } as any,
      };

      const formatted = StreamingUtils.formatEventForDisplay(progressEvent);
      expect(formatted).toContain("Progress: 75%");
      expect(formatted).toContain("Processing data");
    });

    it("should calculate progress percentage from events", () => {
      const progressEvent: ExecutionEvent = {
        type: "progress",
        executionId: "test",
        timestamp: Date.now(),
        data: { progressPercentage: 65 } as any,
      };

      const completeEvent: ExecutionEvent = {
        type: "complete",
        executionId: "test",
        timestamp: Date.now(),
        data: {} as any,
      };

      expect(StreamingUtils.getProgressPercentage(progressEvent)).toBe(65);
      expect(StreamingUtils.getProgressPercentage(completeEvent)).toBe(100);
    });

    it("should detect execution completion", () => {
      const progressEvent: ExecutionEvent = {
        type: "progress",
        executionId: "test",
        timestamp: Date.now(),
        data: {} as any,
      };

      const completeEvent: ExecutionEvent = {
        type: "complete",
        executionId: "test",
        timestamp: Date.now(),
        data: {} as any,
      };

      const errorEvent: ExecutionEvent = {
        type: "error",
        executionId: "test",
        timestamp: Date.now(),
        data: {} as any,
      };

      expect(StreamingUtils.isExecutionComplete(progressEvent)).toBe(false);
      expect(StreamingUtils.isExecutionComplete(completeEvent)).toBe(true);
      expect(StreamingUtils.isExecutionComplete(errorEvent)).toBe(true);
    });
  });

  describe("Event Compression", () => {
    it("should compress multiple progress events", () => {
      const events: ExecutionEvent[] = [
        {
          type: "progress",
          executionId: "test",
          timestamp: Date.now() - 3000,
          data: { executionMode: "single", progressPercentage: 25 } as any,
        },
        {
          type: "progress",
          executionId: "test",
          timestamp: Date.now() - 2000,
          data: { executionMode: "single", progressPercentage: 50 } as any,
        },
        {
          type: "progress",
          executionId: "test",
          timestamp: Date.now() - 1000,
          data: { executionMode: "single", progressPercentage: 75 } as any,
        },
        {
          type: "intermediate",
          executionId: "test",
          timestamp: Date.now(),
          data: { result: "test" } as any,
        },
      ];

      const compressed = EventCompressor.compressProgressEvents(events);

      // Should keep only the latest progress event and all non-progress events
      expect(compressed).toHaveLength(2);
      expect(compressed[0]?.type).toBe("progress");
      expect((compressed[0]?.data as any).progressPercentage).toBe(75);
      expect(compressed[1]?.type).toBe("intermediate");
    });

    it("should summarize intermediate events for large workflows", () => {
      const events: ExecutionEvent[] = [];

      // Create 15 intermediate events
      for (let i = 0; i < 15; i++) {
        events.push({
          type: "intermediate",
          executionId: "test",
          timestamp: Date.now() + i * 1000,
          data: { result: `Result ${i}` } as any,
        });
      }

      const summarized = EventCompressor.summarizeIntermediateEvents(events);

      // Should keep first, last, and every 5th event
      expect(summarized.length).toBeLessThan(15);
      expect(summarized[0]?.timestamp).toBe(events[0]?.timestamp); // First
      expect(summarized[summarized.length - 1]?.timestamp).toBe(events[14]?.timestamp); // Last
    });
  });
});

describe("Integration Tests", () => {
  it("should handle complete streaming workflow", async () => {
    const executionId = "integration-test";
    const eventEmitter = setupExecutionStreaming(executionId);
    const receivedEvents: ExecutionEvent[] = [];

    // Set up event listener
    const { executionEventBus } = await import("@/lib/router/streaming/event-bus");
    executionEventBus.addListener(executionId, (event) => {
      receivedEvents.push(event);
    });

    // Simulate execution workflow
    eventEmitter.emitProgress(executionId, "workflow", {
      executionMode: "workflow",
      currentStep: 1,
      totalSteps: 3,
      stepDescription: "Step 1",
      modelId: "gpt-4",
      estimatedTimeRemaining: 5000,
      progressPercentage: 33,
    });

    eventEmitter.emitIntermediate(executionId, "workflow", {
      stepId: "step-1",
      modelId: "gpt-4",
      result: "Step 1 completed",
      executionTime: 2000,
      tokensUsed: 50,
      cost: 0.01,
      executionMode: "workflow",
    });

    eventEmitter.emitComplete(executionId, "workflow", {
      executionMode: "workflow",
      finalResult: "Workflow completed successfully",
      totalExecutionTime: 8000,
      totalTokensUsed: 150,
      totalCost: 0.03,
      stepsCompleted: 3,
      modelUsage: [],
    });

    // Verify events were received
    expect(receivedEvents).toHaveLength(3);
    expect(receivedEvents[0]?.type).toBe("progress");
    expect(receivedEvents[1]?.type).toBe("intermediate");
    expect(receivedEvents[2]?.type).toBe("complete");

    // Cleanup
    executionEventBus.cleanup(executionId);
  });
});
