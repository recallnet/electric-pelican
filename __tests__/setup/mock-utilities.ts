/**
 * @file Jest Mock Utilities
 * @description Standardized mock patterns for consistent testing
 */

import React from "react";

/**
 * Helper for creating properly typed React hook mocks
 */
export const createHookMock = <T extends (...args: any[]) => any>(
  hookFunction: T,
): jest.MockedFunction<T> => {
  return hookFunction as jest.MockedFunction<T>;
};

/**
 * Helper for mocking Next.js router
 */
export const createNextRouterMock = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  pathname: "/test",
  query: {},
  asPath: "/test",
  back: jest.fn(),
  reload: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  locale: "en",
  locales: ["en"],
  defaultLocale: "en",
});

/**
 * Helper for mocking React Context values
 */
export const createContextMock = <T>(defaultValue: T) => {
  const mockContext = {
    Provider: ({ children }: { children: React.ReactNode; value?: T }) => children,
    Consumer: ({ children }: { children: (value: T) => React.ReactNode }) => children(defaultValue),
    displayName: "MockContext",
  };
  return mockContext;
};

/**
 * Helper for creating mock functions with proper typing
 */
export const createMockFunction = <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};

/**
 * Helper for creating mock objects with jest functions
 */
export const createMockObject = <T extends Record<string, (...args: any[]) => any>>(
  functions: T,
): { [K in keyof T]: jest.MockedFunction<T[K]> } => {
  const mockObj = {} as { [K in keyof T]: jest.MockedFunction<T[K]> };

  for (const key in functions) {
    mockObj[key] = jest.fn() as unknown as jest.MockedFunction<T[typeof key]>;
  }

  return mockObj;
};

/**
 * Helper for creating router state mock with actions
 */
export const createRouterStateMock = () => ({
  state: {
    currentPrompt: "",
    isAnalyzing: false,
    isOptimizing: false,
    showAlternatives: false,
    analysisResult: undefined,
    optimizedWorkflow: undefined,
    singleModelRecommendation: undefined,
    selectedStep: undefined,
    analysisError: undefined,
    selectionError: undefined,
  },
  actions: createMockObject({
    setPrompt: () => {},
    analyzePrompt: () => {},
    selectStep: () => {},
    toggleAlternatives: () => {},
    reset: () => {},
    executeWorkflow: () => {},
    executeSingleModel: () => {},
    executeBoth: () => {},
  }),
});

/**
 * Helper for mocking API responses
 */
export const createApiResponseMock = <T>(data: T, success = true) => ({
  ok: success,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  status: success ? 200 : 500,
  statusText: success ? "OK" : "Internal Server Error",
});

/**
 * Helper for mocking fetch responses
 */
export const createFetchMock = <T>(data: T, success = true) => {
  return jest.fn().mockResolvedValue(createApiResponseMock(data, success));
};

/**
 * Creates a mock NextRequest that properly handles body parsing for API route tests
 *
 * @param url - Request URL
 * @param options - Request options including method, body, headers
 * @returns Mock NextRequest with working text() and json() methods
 */
export const createMockNextRequest = (
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {},
) => {
  const { method = "GET", body = "", headers = {} } = options;

  // Create a mock request that behaves like NextRequest in API routes
  const mockRequest = {
    url,
    method,
    headers: {
      get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
      entries: jest.fn(() => Object.entries(headers)),
    },
    text: jest.fn().mockResolvedValue(body),
    json: jest.fn().mockImplementation(() => {
      if (!body) return Promise.resolve({});
      try {
        return Promise.resolve(JSON.parse(body));
      } catch {
        return Promise.reject(new SyntaxError(`Unexpected token in JSON at position 0`));
      }
    }),
  };

  return mockRequest as any; // Type assertion since we're mocking
};

/**
 * Creates a comprehensive mock for API route testing with proper request/response handling
 */
export const createApiRouteMock = () => ({
  mockRequest: createMockNextRequest,
  mockResponse: {
    json: jest.fn((data: any) => ({
      json: () => Promise.resolve(data),
      status: 200,
    })),
    status: jest.fn((code: number) => ({
      json: (data: any) => ({
        json: () => Promise.resolve(data),
        status: code,
      }),
    })),
  },
});
