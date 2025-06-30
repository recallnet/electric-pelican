import { renderHook, act } from "@testing-library/react";
import { useTournamentProgress } from "@/hooks/useTournamentProgress";

// Mock the typedApi
jest.mock("@/lib/api-client", () => ({
  typedApi: jest.fn(),
}));

describe("useTournamentProgress", () => {
  // Use modern fake timers so setInterval is controlled
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("stops polling when the API responds 404", async () => {
    // Arrange: mock typedApi to return error response
    const { typedApi } = require("@/lib/api-client");
    typedApi.mockResolvedValue({
      success: false,
      error: "Tournament not found",
    });

    // Act: render hook
    const { result } = renderHook(() => useTournamentProgress("missing-123"));

    // Initial fetch happens immediately – flush promises & timers
    await act(async () => {
      // run micro-tasks
      await Promise.resolve();
    });

    // Assert: hook captured the error & stopped polling
    expect(result.current.error).toBe("Tournament not found");
    expect(result.current.isPolling).toBe(false);

    // Advance timers to make sure no further fetches occur
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // typedApi should have been called exactly once
    expect(typedApi).toHaveBeenCalledTimes(1);
    expect(typedApi).toHaveBeenCalledWith("GET /api/tournament/:id/status", { id: "missing-123" });
  });
});
