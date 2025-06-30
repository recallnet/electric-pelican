/**
 * @file Perception & Understanding taxonomy pillar
 * @description L1, L2, and L3 tags for perception and understanding capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const perceptionUnderstandingPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "perception-understanding",
    name: "Perception & Understanding",
    description: "Capabilities related to interpreting and comprehending various forms of input",
  },

  // L2: Families
  {
    id: "multimodal-integration",
    name: "Multimodal Integration",
    description: "Combining and reasoning across different input modalities",
    parentId: "perception-understanding",
  },
  {
    id: "visual-processing",
    name: "Visual Processing",
    description: "Understanding and analyzing visual information",
    parentId: "perception-understanding",
  },
  {
    id: "language-comprehension",
    name: "Language Comprehension",
    description: "Understanding natural language in various contexts",
    parentId: "perception-understanding",
  },
  {
    id: "temporal-processing",
    name: "Temporal Processing",
    description: "Understanding sequences, patterns, and temporal relationships",
    parentId: "perception-understanding",
  },

  // L3: Multimodal Integration Leaves
  {
    id: "vision-language-reasoning",
    name: "Vision Language Reasoning",
    description: "Combining visual and textual information for complex reasoning tasks",
    parentId: "multimodal-integration",
  },
  {
    id: "cross-modal-alignment",
    name: "Cross Modal Alignment",
    description: "Aligning concepts and information across different modalities",
    parentId: "multimodal-integration",
  },
  {
    id: "embodied-perception",
    name: "Embodied Perception",
    description: "Understanding spatial and physical relationships in environments",
    parentId: "multimodal-integration",
  },
  {
    id: "audio-visual-processing",
    name: "Audio Visual Processing",
    description: "Processing and understanding combined audio and visual streams",
    parentId: "multimodal-integration",
  },

  // L3: Visual Processing Leaves
  {
    id: "scene-understanding",
    name: "Scene Understanding",
    description: "Comprehending complex visual scenes and their components",
    parentId: "visual-processing",
  },
  {
    id: "object-detection",
    name: "Object Detection",
    description: "Identifying and locating objects within visual content",
    parentId: "visual-processing",
  },
  {
    id: "spatial-reasoning",
    name: "Spatial Reasoning",
    description: "Understanding spatial relationships and geometric properties",
    parentId: "visual-processing",
  },
  {
    id: "visual-composition",
    name: "Visual Composition",
    description: "Understanding how visual elements are arranged and composed",
    parentId: "visual-processing",
  },
  {
    id: "image-analysis",
    name: "Image Analysis",
    description: "Detailed analysis of image content, quality, and characteristics",
    parentId: "visual-processing",
  },

  // L3: Language Comprehension Leaves
  {
    id: "semantic-understanding",
    name: "Semantic Understanding",
    description: "Grasping the meaning and intent behind language",
    parentId: "language-comprehension",
  },
  {
    id: "pragmatic-inference",
    name: "Pragmatic Inference",
    description: "Understanding implied meanings and contextual nuances",
    parentId: "language-comprehension",
  },
  {
    id: "multilingual-processing",
    name: "Multilingual Processing",
    description: "Understanding and processing multiple languages",
    parentId: "language-comprehension",
  },
  {
    id: "context-interpretation",
    name: "Context Interpretation",
    description: "Understanding meaning within specific contexts and situations",
    parentId: "language-comprehension",
  },

  // L3: Temporal Processing Leaves
  {
    id: "sequence-modeling",
    name: "Sequence Modeling",
    description: "Understanding patterns and relationships in sequential data",
    parentId: "temporal-processing",
  },
  {
    id: "temporal-reasoning",
    name: "Temporal Reasoning",
    description: "Reasoning about time-based relationships and causality",
    parentId: "temporal-processing",
  },
  {
    id: "long-context-understanding",
    name: "Long Context Understanding",
    description: "Maintaining coherence across extended contexts",
    parentId: "temporal-processing",
  },
  {
    id: "pattern-recognition",
    name: "Pattern Recognition",
    description: "Identifying recurring patterns and structures in data",
    parentId: "temporal-processing",
  },
];
