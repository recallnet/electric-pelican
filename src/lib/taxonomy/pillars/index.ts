/**
 * @file Taxonomy pillars index
 * @description Combines all taxonomy pillars into the complete hierarchy
 */

import type { TaxonomyTag } from "@/types/taxonomy";

import { communicationExpressionPillar } from "./communication-expression";
import { creativityInnovationPillar } from "./creativity-innovation";
import { knowledgeLearningPillar } from "./knowledge-learning";
import { perceptionUnderstandingPillar } from "./perception-understanding";
import { reasoningProblemSolvingPillar } from "./reasoning-problem-solving";
import { technicalImplementationPillar } from "./technical-implementation";

/**
 * Complete taxonomy of AI capabilities organized in a three-level hierarchy.
 * Combines all capability pillars into a single array.
 */
export const HIERARCHICAL_TAXONOMY: TaxonomyTag[] = [
  ...perceptionUnderstandingPillar,
  ...communicationExpressionPillar,
  ...reasoningProblemSolvingPillar,
  ...knowledgeLearningPillar,
  ...creativityInnovationPillar,
  ...technicalImplementationPillar,
];
