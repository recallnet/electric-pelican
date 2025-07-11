/**
 * Admin-related type definitions
 */

export interface UnavailableModel {
  id: string;
  name: string;
  provider: string;
  failure_count: number;
  marked_unavailable_at: string | null;
  unavailable_reason: string | null;
  last_failure_at: string | null;
}

export interface UnavailableModelsResponse {
  models: UnavailableModel[];
  total: number;
}
