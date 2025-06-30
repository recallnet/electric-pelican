/**
 * @file Creativity & Innovation taxonomy pillar
 * @description L1, L2, and L3 tags for creativity and innovation capabilities
 */

import type { TaxonomyTag } from "@/types/taxonomy";

export const creativityInnovationPillar: TaxonomyTag[] = [
  // L1: Core Pillar
  {
    id: "creativity-innovation",
    name: "Creativity & Innovation",
    description: "Creative generation, design thinking, and innovative problem-solving",
  },

  // L2: Families
  {
    id: "creative-generation",
    name: "Creative Generation",
    description: "Generating novel and creative content",
    parentId: "creativity-innovation",
  },
  {
    id: "design-thinking",
    name: "Design Thinking",
    description: "Systematic approach to creative problem-solving",
    parentId: "creativity-innovation",
  },
  {
    id: "artistic-expression",
    name: "Artistic Expression",
    description: "Creating artistic and aesthetic content",
    parentId: "creativity-innovation",
  },
  {
    id: "innovation-methodology",
    name: "Innovation Methodology",
    description: "Systematic approaches to innovation and improvement",
    parentId: "creativity-innovation",
  },

  // L3: Creative Generation Leaves
  {
    id: "original-ideation",
    name: "Original Ideation",
    description: "Generating original ideas and concepts",
    parentId: "creative-generation",
  },
  {
    id: "creative-synthesis",
    name: "Creative Synthesis",
    description: "Combining existing elements in novel ways",
    parentId: "creative-generation",
  },
  {
    id: "imaginative-scenarios",
    name: "Imaginative Scenarios",
    description: "Creating imaginative and hypothetical scenarios",
    parentId: "creative-generation",
  },
  {
    id: "alternative-solutions",
    name: "Alternative Solutions",
    description: "Developing multiple creative solutions to problems",
    parentId: "creative-generation",
  },

  // L3: Design Thinking Leaves
  {
    id: "user-centered-design",
    name: "User Centered Design",
    description: "Designing with focus on user needs and experiences",
    parentId: "design-thinking",
  },
  {
    id: "iterative-improvement",
    name: "Iterative Improvement",
    description: "Continuously improving through iteration and feedback",
    parentId: "design-thinking",
  },
  {
    id: "systems-thinking",
    name: "Systems Thinking",
    description: "Understanding and designing complex systems",
    parentId: "design-thinking",
  },
  {
    id: "design-constraints",
    name: "Design Constraints",
    description: "Working creatively within given constraints",
    parentId: "design-thinking",
  },

  // L3: Artistic Expression Leaves
  {
    id: "aesthetic-composition",
    name: "Aesthetic Composition",
    description: "Creating aesthetically pleasing compositions",
    parentId: "artistic-expression",
  },
  {
    id: "style-development",
    name: "Style Development",
    description: "Developing unique artistic styles",
    parentId: "artistic-expression",
  },
  {
    id: "emotional-expression",
    name: "Emotional Expression",
    description: "Expressing emotions through creative work",
    parentId: "artistic-expression",
  },
  {
    id: "creative-interpretation",
    name: "Creative Interpretation",
    description: "Interpreting concepts in creative and unique ways",
    parentId: "artistic-expression",
  },

  // L3: Innovation Methodology Leaves
  {
    id: "disruptive-thinking",
    name: "Disruptive Thinking",
    description: "Challenging conventional approaches and assumptions",
    parentId: "innovation-methodology",
  },
  {
    id: "trend-analysis",
    name: "Trend Analysis",
    description: "Identifying and analyzing emerging trends",
    parentId: "innovation-methodology",
  },
  {
    id: "opportunity-identification",
    name: "Opportunity Identification",
    description: "Identifying opportunities for innovation and improvement",
    parentId: "innovation-methodology",
  },
  {
    id: "prototype-thinking",
    name: "Prototype Thinking",
    description: "Rapid prototyping and testing of ideas",
    parentId: "innovation-methodology",
  },
];
