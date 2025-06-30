/**
 * @file Knowledge & Learning taxonomy pillar
 * @description L1, L2, and L3 tags for knowledge and learning capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const knowledgeLearningPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "knowledge-learning",
    name: "Knowledge & Learning",
    description: "Domain expertise, information synthesis, and adaptive learning capabilities",
  },

  // L2: Families
  {
    id: "domain-expertise",
    name: "Domain Expertise",
    description: "Specialized knowledge in specific domains",
    parentId: "knowledge-learning",
  },
  {
    id: "financial-economic",
    name: "Financial & Economic",
    description: "Financial markets, economics, and business knowledge",
    parentId: "knowledge-learning",
  },
  {
    id: "knowledge-integration",
    name: "Knowledge Integration",
    description: "Combining and synthesizing knowledge from multiple sources",
    parentId: "knowledge-learning",
  },
  {
    id: "adaptive-learning",
    name: "Adaptive Learning",
    description: "Learning and adapting from new information",
    parentId: "knowledge-learning",
  },
  {
    id: "memory-retrieval",
    name: "Memory & Retrieval",
    description: "Accessing and retrieving relevant information",
    parentId: "knowledge-learning",
  },

  // L3: Domain Expertise Leaves
  {
    id: "scientific-knowledge",
    name: "Scientific Knowledge",
    description: "Understanding scientific principles, theories, and methods",
    parentId: "domain-expertise",
  },
  {
    id: "legal-reasoning",
    name: "Legal Reasoning",
    description: "Understanding legal principles, procedures, and reasoning",
    parentId: "domain-expertise",
  },
  {
    id: "historical-analysis",
    name: "Historical Analysis",
    description: "Analyzing historical events, patterns, and contexts",
    parentId: "domain-expertise",
  },
  {
    id: "medical-knowledge",
    name: "Medical Knowledge",
    description: "Understanding medical concepts, procedures, and practices",
    parentId: "domain-expertise",
  },
  {
    id: "technical-specialization",
    name: "Technical Specialization",
    description: "Deep expertise in specific technical domains",
    parentId: "domain-expertise",
  },

  // L3: Financial & Economic Leaves
  {
    id: "financial-markets",
    name: "Financial Markets",
    description: "Understanding financial markets, instruments, and dynamics",
    parentId: "financial-economic",
  },
  {
    id: "investment-analysis",
    name: "Investment Analysis",
    description: "Analyzing investment opportunities and strategies",
    parentId: "financial-economic",
  },
  {
    id: "cryptocurrency-blockchain",
    name: "Cryptocurrency Blockchain",
    description: "Understanding blockchain technology and cryptocurrency markets",
    parentId: "financial-economic",
  },
  {
    id: "economic-modeling",
    name: "Economic Modeling",
    description: "Creating and analyzing economic models and forecasts",
    parentId: "financial-economic",
  },
  {
    id: "trading-strategies",
    name: "Trading Strategies",
    description: "Developing and implementing trading strategies",
    parentId: "financial-economic",
  },
  {
    id: "risk-assessment",
    name: "Risk Assessment",
    description: "Evaluating and managing various types of risks",
    parentId: "financial-economic",
  },

  // L3: Knowledge Integration Leaves
  {
    id: "cross-domain-synthesis",
    name: "Cross Domain Synthesis",
    description: "Combining knowledge from different domains",
    parentId: "knowledge-integration",
  },
  {
    id: "information-synthesis",
    name: "Information Synthesis",
    description: "Synthesizing information from multiple sources",
    parentId: "knowledge-integration",
  },
  {
    id: "knowledge-grounding",
    name: "Knowledge Grounding",
    description: "Connecting abstract knowledge to concrete examples",
    parentId: "knowledge-integration",
  },
  {
    id: "fact-verification",
    name: "Fact Verification",
    description: "Verifying the accuracy and reliability of information",
    parentId: "knowledge-integration",
  },

  // L3: Adaptive Learning Leaves
  {
    id: "few-shot-learning",
    name: "Few Shot Learning",
    description: "Learning from limited examples and generalizing",
    parentId: "adaptive-learning",
  },
  {
    id: "in-context-learning",
    name: "In Context Learning",
    description: "Learning and adapting within the context of a conversation",
    parentId: "adaptive-learning",
  },
  {
    id: "continual-adaptation",
    name: "Continual Adaptation",
    description: "Continuously adapting to new information and contexts",
    parentId: "adaptive-learning",
  },
  {
    id: "transfer-learning",
    name: "Transfer Learning",
    description: "Applying knowledge from one domain to another",
    parentId: "adaptive-learning",
  },

  // L3: Memory & Retrieval Leaves
  {
    id: "information-access",
    name: "Information Access",
    description: "Efficiently accessing relevant information",
    parentId: "memory-retrieval",
  },
  {
    id: "knowledge-recall",
    name: "Knowledge Recall",
    description: "Recalling specific facts and information accurately",
    parentId: "memory-retrieval",
  },
  {
    id: "semantic-search",
    name: "Semantic Search",
    description: "Finding relevant information based on meaning",
    parentId: "memory-retrieval",
  },
  {
    id: "contextual-retrieval",
    name: "Contextual Retrieval",
    description: "Retrieving information relevant to current context",
    parentId: "memory-retrieval",
  },
];
