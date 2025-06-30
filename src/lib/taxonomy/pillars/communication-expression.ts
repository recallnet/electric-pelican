/**
 * @file Communication & Expression taxonomy pillar
 * @description L1, L2, and L3 tags for communication and expression capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const communicationExpressionPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "communication-expression",
    name: "Communication & Expression",
    description: "Capabilities for generating and communicating information effectively",
  },

  // L2: Families
  {
    id: "written-production",
    name: "Written Production",
    description: "Generating various forms of written content",
    parentId: "communication-expression",
  },
  {
    id: "interactive-communication",
    name: "Interactive Communication",
    description: "Engaging in dynamic, responsive communication",
    parentId: "communication-expression",
  },
  {
    id: "multimodal-expression",
    name: "Multimodal Expression",
    description: "Generating content across multiple modalities",
    parentId: "communication-expression",
  },
  {
    id: "cultural-communication",
    name: "Cultural Communication",
    description: "Communicating effectively across cultural contexts",
    parentId: "communication-expression",
  },
  {
    id: "persuasion-influence",
    name: "Persuasion & Influence",
    description: "Crafting persuasive and influential communication",
    parentId: "communication-expression",
  },
  {
    id: "contextual-execution",
    name: "Contextual Execution",
    description: "Following instructions and executing tasks within context",
    parentId: "communication-expression",
  },

  // L3: Written Production Leaves
  {
    id: "formal-writing",
    name: "Formal Writing",
    description: "Professional, academic, and structured writing",
    parentId: "written-production",
  },
  {
    id: "narrative-generation",
    name: "Narrative Generation",
    description: "Creating compelling stories and narratives",
    parentId: "written-production",
  },
  {
    id: "technical-documentation",
    name: "Technical Documentation",
    description: "Creating clear technical documentation and guides",
    parentId: "written-production",
  },
  {
    id: "style-adaptation",
    name: "Style Adaptation",
    description: "Adapting writing style to different audiences and contexts",
    parentId: "written-production",
  },
  {
    id: "creative-writing",
    name: "Creative Writing",
    description: "Producing original creative content and literature",
    parentId: "written-production",
  },

  // L3: Interactive Communication Leaves
  {
    id: "dialogue-management",
    name: "Dialogue Management",
    description: "Managing coherent multi-turn conversations",
    parentId: "interactive-communication",
  },
  {
    id: "audience-adaptation",
    name: "Audience Adaptation",
    description: "Tailoring communication to specific audiences",
    parentId: "interactive-communication",
  },
  {
    id: "real-time-response",
    name: "Real Time Response",
    description: "Providing appropriate responses in real-time interactions",
    parentId: "interactive-communication",
  },
  {
    id: "conversational-flow",
    name: "Conversational Flow",
    description: "Maintaining natural conversation flow and coherence",
    parentId: "interactive-communication",
  },

  // L3: Multimodal Expression Leaves
  {
    id: "vision-language-generation",
    name: "Vision Language Generation",
    description: "Generating language based on visual input",
    parentId: "multimodal-expression",
  },
  {
    id: "multimedia-synthesis",
    name: "Multimedia Synthesis",
    description: "Creating integrated multimedia content",
    parentId: "multimodal-expression",
  },
  {
    id: "cross-modal-translation",
    name: "Cross Modal Translation",
    description: "Translating concepts between different modalities",
    parentId: "multimodal-expression",
  },
  {
    id: "integrated-output",
    name: "Integrated Output",
    description: "Producing cohesive multi-modal outputs",
    parentId: "multimodal-expression",
  },

  // L3: Cultural Communication Leaves
  {
    id: "cross-cultural-adaptation",
    name: "Cross Cultural Adaptation",
    description: "Adapting communication for different cultural contexts",
    parentId: "cultural-communication",
  },
  {
    id: "localization",
    name: "Localization",
    description: "Adapting content for specific locales and regions",
    parentId: "cultural-communication",
  },
  {
    id: "cultural-sensitivity",
    name: "Cultural Sensitivity",
    description: "Demonstrating awareness of cultural differences and sensitivities",
    parentId: "cultural-communication",
  },
  {
    id: "language-variation",
    name: "Language Variation",
    description: "Understanding and using different language varieties and dialects",
    parentId: "cultural-communication",
  },
  {
    id: "cultural-context-interpretation",
    name: "Cultural Context Interpretation",
    description: "Understanding cultural context and its impact on communication",
    parentId: "cultural-communication",
  },

  // L3: Persuasion & Influence Leaves
  {
    id: "persuasive-argumentation",
    name: "Persuasive Argumentation",
    description: "Constructing compelling arguments and persuasive content",
    parentId: "persuasion-influence",
  },
  {
    id: "negotiation-strategy",
    name: "Negotiation Strategy",
    description: "Developing effective negotiation approaches and tactics",
    parentId: "persuasion-influence",
  },
  {
    id: "influence-techniques",
    name: "Influence Techniques",
    description: "Applying various influence and persuasion techniques",
    parentId: "persuasion-influence",
  },
  {
    id: "rhetorical-effectiveness",
    name: "Rhetorical Effectiveness",
    description: "Using rhetorical devices and techniques effectively",
    parentId: "persuasion-influence",
  },

  // L3: Contextual Execution Leaves
  {
    id: "instruction-following",
    name: "Instruction Following",
    description: "Accurately following complex instructions and guidelines",
    parentId: "contextual-execution",
  },
  {
    id: "task-context-integration",
    name: "Task Context Integration",
    description: "Integrating task requirements with broader context",
    parentId: "contextual-execution",
  },
  {
    id: "complex-prompt-handling",
    name: "Complex Prompt Handling",
    description: "Managing and responding to complex, multi-part prompts",
    parentId: "contextual-execution",
  },
  {
    id: "context-preservation",
    name: "Context Preservation",
    description: "Maintaining relevant context throughout task execution",
    parentId: "contextual-execution",
  },
];
