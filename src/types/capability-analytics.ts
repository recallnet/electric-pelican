/**
 * @file Capability analytics type definitions
 * @description Type definitions for capability measurement and analytics
 */

import type { HierarchicalTagId } from "./taxonomy";

/**
 * Interface for capability measurement data
 */
export interface CapabilityMeasurement {
  tagId: HierarchicalTagId;
  tagName: string;
  tagDescription: string;
  avgMatchesPerModel: number;
  totalModels: number;
  totalMatches: number;
}
