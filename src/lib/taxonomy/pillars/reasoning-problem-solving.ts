/**
 * @file Reasoning & Problem-Solving taxonomy pillar
 * @description L1, L2, and L3 tags for reasoning and problem-solving capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const reasoningProblemSolvingPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "reasoning-problem-solving",
    name: "Reasoning & Problem-Solving",
    description: "Logical thinking, analysis, and systematic problem-solving capabilities",
  },

  // L2: Families
  {
    id: "logical-reasoning",
    name: "Logical Reasoning",
    description: "Systematic logical thinking and inference",
    parentId: "reasoning-problem-solving",
  },
  {
    id: "quantitative-reasoning",
    name: "Quantitative Reasoning",
    description: "Mathematical and numerical problem-solving",
    parentId: "reasoning-problem-solving",
  },
  {
    id: "strategic-planning",
    name: "Strategic Planning",
    description: "Long-term planning and strategic thinking",
    parentId: "reasoning-problem-solving",
  },
  {
    id: "causal-reasoning",
    name: "Causal Reasoning",
    description: "Understanding cause-and-effect relationships",
    parentId: "reasoning-problem-solving",
  },
  {
    id: "abstract-reasoning",
    name: "Abstract Reasoning",
    description: "Working with abstract concepts and relationships",
    parentId: "reasoning-problem-solving",
  },

  // L3: Logical Reasoning Leaves
  {
    id: "deductive-inference",
    name: "Deductive Inference",
    description: "Drawing logical conclusions from given premises",
    parentId: "logical-reasoning",
  },
  {
    id: "inductive-reasoning",
    name: "Inductive Reasoning",
    description: "Generalizing from specific observations to broader principles",
    parentId: "logical-reasoning",
  },
  {
    id: "abductive-reasoning",
    name: "Abductive Reasoning",
    description: "Finding the best explanation for observed phenomena",
    parentId: "logical-reasoning",
  },
  {
    id: "constraint-satisfaction",
    name: "Constraint Satisfaction",
    description: "Solving problems within given constraints and limitations",
    parentId: "logical-reasoning",
  },
  {
    id: "formal-logic",
    name: "Formal Logic",
    description: "Applying formal logical systems and rules",
    parentId: "logical-reasoning",
  },

  // L3: Quantitative Reasoning Leaves
  {
    id: "mathematical-computation",
    name: "Mathematical Computation",
    description: "Performing mathematical calculations and operations",
    parentId: "quantitative-reasoning",
  },
  {
    id: "statistical-analysis",
    name: "Statistical Analysis",
    description: "Analyzing data using statistical methods and techniques",
    parentId: "quantitative-reasoning",
  },
  {
    id: "numerical-estimation",
    name: "Numerical Estimation",
    description: "Making reasonable numerical estimates and approximations",
    parentId: "quantitative-reasoning",
  },
  {
    id: "data-interpretation",
    name: "Data Interpretation",
    description: "Understanding and interpreting quantitative data",
    parentId: "quantitative-reasoning",
  },

  // L3: Strategic Planning Leaves
  {
    id: "multi-step-planning",
    name: "Multi Step Planning",
    description: "Creating detailed multi-step plans and strategies",
    parentId: "strategic-planning",
  },
  {
    id: "scenario-analysis",
    name: "Scenario Analysis",
    description: "Analyzing different scenarios and their implications",
    parentId: "strategic-planning",
  },
  {
    id: "resource-optimization",
    name: "Resource Optimization",
    description: "Optimizing the use of available resources",
    parentId: "strategic-planning",
  },
  {
    id: "goal-decomposition",
    name: "Goal Decomposition",
    description: "Breaking down complex goals into manageable components",
    parentId: "strategic-planning",
  },

  // L3: Causal Reasoning Leaves
  {
    id: "causal-inference",
    name: "Causal Inference",
    description: "Identifying causal relationships from data and observations",
    parentId: "causal-reasoning",
  },
  {
    id: "counterfactual-reasoning",
    name: "Counterfactual Reasoning",
    description: "Reasoning about alternative scenarios and what-if situations",
    parentId: "causal-reasoning",
  },
  {
    id: "mechanism-understanding",
    name: "Mechanism Understanding",
    description: "Understanding how systems and processes work",
    parentId: "causal-reasoning",
  },
  {
    id: "cause-effect-modeling",
    name: "Cause Effect Modeling",
    description: "Creating models of cause-and-effect relationships",
    parentId: "causal-reasoning",
  },

  // L3: Abstract Reasoning Leaves
  {
    id: "analogical-reasoning",
    name: "Analogical Reasoning",
    description: "Drawing analogies and applying them to solve problems",
    parentId: "abstract-reasoning",
  },
  {
    id: "conceptual-thinking",
    name: "Conceptual Thinking",
    description: "Working with abstract concepts and ideas",
    parentId: "abstract-reasoning",
  },
  {
    id: "pattern-abstraction",
    name: "Pattern Abstraction",
    description: "Extracting abstract patterns from concrete examples",
    parentId: "abstract-reasoning",
  },
  {
    id: "symbolic-manipulation",
    name: "Symbolic Manipulation",
    description: "Working with symbols and symbolic representations",
    parentId: "abstract-reasoning",
  },
];
