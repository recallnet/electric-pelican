import type { Metadata } from "next";

/**
 * Static metadata for the AI Capability Taxonomy page.
 * Provides SEO optimization for the hierarchical capability explorer.
 */
export const metadata: Metadata = {
  title: "AI Capability Taxonomy - Model Performance Hierarchy",
  description:
    "Explore the complete hierarchy of AI capabilities and discover which models lead in each area. Interactive tree showing ELO rankings across perception, reasoning, creativity, and technical implementation.",
  keywords: [
    "AI taxonomy",
    "model capabilities",
    "ELO rankings",
    "AI hierarchy",
    "model comparison",
    "artificial intelligence",
    "language models",
    "performance comparison",
    "AI evaluation",
    "model leaderboard",
    "capability assessment",
    "hierarchical taxonomy",
  ].join(", "),

  openGraph: {
    title: "AI Capability Taxonomy - Interactive Model Performance Tree",
    description:
      "Discover which AI models excel in specific capabilities. Interactive hierarchy showing ELO rankings across all AI capability domains.",
    type: "website",
    siteName: "Model Eval",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "AI Capability Taxonomy - Model Performance Hierarchy",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Capability Taxonomy - Model Performance Hierarchy",
    description: "Interactive tree showing which AI models lead in each capability area",
    images: ["/logo.png"],
  },

  // Structured data hints for search engines
  other: {
    "article:section": "Technology",
    "article:tag": "AI Capabilities",
    robots: "index, follow",
  },

  // Canonical URL to prevent duplicate content issues
  alternates: {
    canonical: "/capabilities",
  },
};
