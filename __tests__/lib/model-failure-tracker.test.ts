/**
 * @jest-environment node
 */

import { classifyOpenRouterError } from "@/lib/model-error-classifier";
import {
  trackModelFailure,
  trackModelSuccess,
  // getModelFailureInfo,
  markModelAvailable,
} from "@/lib/model-failure-tracker";
import { db } from "../../db";
// import { models } from "../../db/schema";
// import { eq } from "drizzle-orm";

// Mock the database
jest.mock("../../db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    $count: jest.fn(),
  },
}));

jest.mock("../../db/schema", () => ({
  models: {
    id: "id",
    is_available: "is_available",
    failure_count: "failure_count",
    last_failure_at: "last_failure_at",
    unavailable_reason: "unavailable_reason",
    marked_unavailable_at: "marked_unavailable_at",
  },
}));

const mockDb = db as any;

describe("OpenRouter Error Classification", () => {
  describe("classifyOpenRouterError", () => {
    it("should mark permanent failures as unavailable", () => {
      const error502 = { status: 502, message: "Model down" };
      const classification = classifyOpenRouterError(error502);

      expect(classification.shouldMarkUnavailable).toBe(true);
      expect(classification.isRecoverable).toBe(true);
      expect(classification.reason).toContain("Model down or invalid response (502)");
    });

    it("should not mark temporary failures as unavailable", () => {
      const error429 = { status: 429, message: "Rate limited" };
      const classification = classifyOpenRouterError(error429);

      expect(classification.shouldMarkUnavailable).toBe(false);
      expect(classification.isRecoverable).toBe(true);
      expect(classification.reason).toContain("Rate limited (429) - temporary issue");
    });

    it("should not mark user-caused failures as unavailable", () => {
      const error400 = { status: 400, message: "Bad request" };
      const classification = classifyOpenRouterError(error400);

      expect(classification.shouldMarkUnavailable).toBe(false);
      expect(classification.isRecoverable).toBe(false);
      expect(classification.reason).toContain("Bad request (400) - user/prompt issue");
    });

    it("should handle moderation errors correctly", () => {
      const error403 = {
        status: 403,
        message: "Content flagged",
        error: { metadata: { reasons: ["violence", "hate"] } },
      };
      const classification = classifyOpenRouterError(error403);

      expect(classification.shouldMarkUnavailable).toBe(false);
      expect(classification.isRecoverable).toBe(false);
      expect(classification.reason).toContain(
        "Content moderation (403) - prompt flagged: violence, hate",
      );
    });

    it("should mark unknown errors as unavailable conservatively", () => {
      const unknownError = { status: 999, message: "Unknown error" };
      const classification = classifyOpenRouterError(unknownError);

      expect(classification.shouldMarkUnavailable).toBe(true);
      expect(classification.isRecoverable).toBe(true);
      expect(classification.reason).toContain("Unknown error (999)");
    });

    it("should handle empty response errors", () => {
      const emptyError = { message: "Empty response from model" };
      const classification = classifyOpenRouterError(emptyError);

      expect(classification.shouldMarkUnavailable).toBe(true);
      expect(classification.isRecoverable).toBe(true);
      expect(classification.reason).toContain("Model returned empty response");
    });
  });
});

describe("Model Failure Tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trackModelFailure", () => {
    it("should not track failures that shouldn't mark model unavailable", async () => {
      const error = { status: 400, message: "Bad request" };

      await trackModelFailure("test-model", error);

      // Should not call database update since this error type shouldn't be tracked
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it("should track permanent failures and mark unavailable after 3 failures", async () => {
      const error = { status: 502, message: "Model down" };
      const mockModel = {
        id: "test-model",
        failure_count: 2,
        last_failure_at: null,
        is_available: true,
      };

      // Mock database responses
      mockDb.limit.mockResolvedValue([mockModel]);
      mockDb.set.mockResolvedValue(undefined);

      await trackModelFailure("test-model", error);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_count: 3,
          is_available: false,
          unavailable_reason: expect.stringContaining("Model down or invalid response (502)"),
        }),
      );
    });

    it("should reset failure count if last failure was over 24 hours ago", async () => {
      const error = { status: 502, message: "Model down" };
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const mockModel = {
        id: "test-model",
        failure_count: 2,
        last_failure_at: oldDate,
        is_available: true,
      };

      mockDb.limit.mockResolvedValue([mockModel]);
      mockDb.set.mockResolvedValue(undefined);

      await trackModelFailure("test-model", error);

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          failure_count: 1, // Reset to 1 instead of incrementing to 3
        }),
      );
    });
  });

  describe("trackModelSuccess", () => {
    it("should reset failure count on successful execution", async () => {
      mockDb.set.mockResolvedValue(undefined);

      await trackModelSuccess("test-model");

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({
        failure_count: 0,
        last_failure_at: null,
      });
    });
  });

  describe("markModelAvailable", () => {
    it("should restore model availability with optional reason", async () => {
      mockDb.set.mockResolvedValue(undefined);

      await markModelAvailable("test-model", "Added API key");

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({
        is_available: true,
        failure_count: 0,
        last_failure_at: null,
        unavailable_reason: "Manually restored: Added API key",
        marked_unavailable_at: null,
      });
    });
  });
});
