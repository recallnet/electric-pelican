import { expectType } from "tsd";
import { typedApi } from "../src/lib/api-client";
import type { ProcessedModel } from "../src/types/models";

// Test that the API client returns the correct inferred type
expectType<
  Promise<{
    models: ProcessedModel[];
    timestamp: string;
    cached: boolean;
  }>
>(typedApi("GET /api/models", {}));
