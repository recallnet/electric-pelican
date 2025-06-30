import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { useModelSearch } from "@/hooks/useModelSearch";
import { ProcessedModel } from "@/types/models";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock models data
const mockModels: ProcessedModel[] = [
  {
    id: "openai/gpt-4",
    name: "GPT-4",
    provider: "openai",
    description: "Advanced language model",
    rank: 1,
    isNew: false,
    tokens_served: 1000000,
    capabilities: ["text"],
    input_modalities: ["text"],
    output_modalities: ["text"],
    context_length: 8192,
    created: Date.now(),
  },
  {
    id: "anthropic/claude-3",
    name: "Claude 3",
    provider: "anthropic",
    description: "Helpful AI assistant",
    rank: 2,
    isNew: true,
    tokens_served: 500000,
    capabilities: ["text"],
    input_modalities: ["text"],
    output_modalities: ["text"],
    context_length: 200000,
    created: Date.now(),
  },
];

describe("useModelSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return initial models when no search query", () => {
    const { result } = renderHook(() => useModelSearch({ initialModels: mockModels }));

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isShowingSearchResults).toBe(false);
  });

  it("should perform search with debouncing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [mockModels[0]], // Only GPT-4 in search results
        cached: false,
        timestamp: new Date().toISOString(),
      }),
    });

    const { result } = renderHook(() =>
      useModelSearch({ initialModels: mockModels, debounceMs: 300 }),
    );

    // Set search query
    act(() => {
      result.current.setSearchQuery("gpt");
    });

    expect(result.current.searchQuery).toBe("gpt");
    expect(result.current.isSearching).toBe(false); // Not searching yet due to debounce

    // Fast-forward past debounce delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isSearching).toBe(true);

    // Wait for the API call to complete
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/models?q=gpt&limit=100&capability=all",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        cache: "no-cache",
      }),
    );

    expect(result.current.models).toEqual([mockModels[0]]);
    expect(result.current.isShowingSearchResults).toBe(true);
  });

  it("should handle search errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useModelSearch({ initialModels: mockModels, debounceMs: 100 }),
    );

    act(() => {
      result.current.setSearchQuery("test");
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.searchError).toBe("Network error");
    });

    expect(result.current.models).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("should clear search and return to initial models", () => {
    const { result } = renderHook(() => useModelSearch({ initialModels: mockModels }));

    // Set search query first
    act(() => {
      result.current.setSearchQuery("test");
    });

    expect(result.current.searchQuery).toBe("test");

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchQuery).toBe("");
    expect(result.current.models).toEqual(mockModels);
    expect(result.current.isShowingSearchResults).toBe(false);
    expect(result.current.searchError).toBeNull();
  });

  it("should cancel previous search when new search is triggered", async () => {
    const abortSpy = jest.fn();
    const mockController = {
      abort: abortSpy,
      signal: { aborted: false } as AbortSignal,
    };

    // Mock AbortController
    global.AbortController = jest.fn(() => mockController) as any;

    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() =>
      useModelSearch({ initialModels: mockModels, debounceMs: 100 }),
    );

    // First search
    act(() => {
      result.current.setSearchQuery("first");
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Second search should cancel the first
    act(() => {
      result.current.setSearchQuery("second");
    });

    expect(abortSpy).toHaveBeenCalled();
  });
});
