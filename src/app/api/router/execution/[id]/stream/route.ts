/**
 * @file SSE streaming endpoint for Router-3B
 * @description Provides real-time execution progress updates via Server-Sent Events
 */

import { NextRequest, NextResponse } from "next/server";

import {
  connectionManager,
  generateConnectionId,
  parseStreamingPreferences,
  validateStreamingPreferences,
} from "@/lib/router/streaming/connection-manager";
import { eventBuffer } from "@/lib/router/streaming/event-buffer";
import { executionEventBus } from "@/lib/router/streaming/event-bus";
import type { ExecutionEvent } from "@/types/router";

/**
 * GET /api/router/execution/[id]/stream
 *
 * Server-Sent Events endpoint for streaming execution progress.
 * Supports real-time updates with automatic reconnection and event buffering.
 *
 * Query Parameters:
 * - includeIntermediate: boolean (default: true) - Include intermediate step results
 * - progressInterval: number (default: 500) - Progress update interval in milliseconds
 * - maxLength: number (default: 5000) - Maximum result length before truncation
 * - since: number (optional) - Timestamp to replay events since (for reconnection)
 *
 * Response: text/event-stream with ExecutionEvent objects
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: executionId } = await params;
  const connectionId = generateConnectionId();

  // Validate execution ID
  if (!executionId || executionId.length < 5) {
    return NextResponse.json({ error: "Invalid execution ID" }, { status: 400 });
  }

  console.log(`New SSE connection request for execution: ${executionId}`);

  try {
    // Parse streaming preferences from URL
    const preferences = validateStreamingPreferences(parseStreamingPreferences(request.url));

    // Set up SSE headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        console.log(
          `Starting SSE stream for execution: ${executionId}, connection: ${connectionId}`,
        );

        // Create stream handler for this connection
        const streamHandler = {
          connectionId,
          send: (event: ExecutionEvent) => {
            try {
              const eventData = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(new TextEncoder().encode(eventData));
            } catch (error) {
              console.error("Error sending SSE event:", error);
            }
          },
          close: () => {
            try {
              controller.close();
            } catch (error) {
              // Controller might already be closed
            }
          },
        };

        // Register connection with manager
        connectionManager.addConnection(
          {
            connectionId,
            executionId,
            connectionType: "sse",
            lastSeen: Date.now(),
            preferences,
          },
          streamHandler,
        );

        // Send initial connection event
        const initialEvent: ExecutionEvent = {
          type: "connected",
          executionId,
          timestamp: Date.now(),
          data: {
            connectionId,
            status: "connected",
          },
        };

        streamHandler.send(initialEvent);

        // Replay recent events for reconnection support
        const sinceParam = new URL(request.url).searchParams.get("since");
        const since = sinceParam ? parseInt(sinceParam, 10) : undefined;

        if (since) {
          console.log(`Replaying events since ${since} for connection: ${connectionId}`);
          const replayedCount = eventBuffer.replayEvents(
            executionId,
            (event) => streamHandler.send(event),
            since,
          );
          console.log(`Replayed ${replayedCount} events for connection: ${connectionId}`);
        } else {
          // Send recent events for context
          const recentEvents = eventBuffer.getRecentEvents(executionId, 5);
          recentEvents.forEach((event) => streamHandler.send(event));
        }

        // Set up event listener for new events
        const eventListener = (event: ExecutionEvent) => {
          if (event.executionId === executionId) {
            streamHandler.send(event);
          }
        };

        executionEventBus.addListener(executionId, eventListener);

        // Cleanup on connection close
        const cleanup = () => {
          console.log(`Cleaning up SSE connection: ${connectionId}`);
          executionEventBus.removeListener(executionId, eventListener);
          connectionManager.removeConnection(connectionId);
        };

        // Handle client disconnect
        request.signal.addEventListener("abort", cleanup);

        // Note: Controller cleanup is handled by the cancel() method below
      },

      cancel() {
        console.log(
          `SSE stream cancelled for execution: ${executionId}, connection: ${connectionId}`,
        );
        connectionManager.removeConnection(connectionId);
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("Error setting up SSE stream:", error);
    return NextResponse.json(
      { error: "Failed to establish streaming connection" },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
