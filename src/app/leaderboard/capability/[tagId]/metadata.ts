import type { Metadata } from "next";

import { getTagInfo, getTagLineage } from "@/lib/tag-taxonomy";
import type { TagLeaderboardMetadataProps } from "@/types/pages";

/**
 * Generate dynamic metadata for tag leaderboard pages.
 * Provides SEO-optimized titles, descriptions, and structured data.
 */
export async function generateMetadata({ params }: TagLeaderboardMetadataProps): Promise<Metadata> {
  const { tagId } = await params;

  // Get tag information from taxonomy
  const tagInfo = getTagInfo(tagId);

  if (!tagInfo) {
    return {
      title: "Tag Not Found - Model Leaderboard",
      description: "The requested capability tag was not found.",
      robots: "noindex, nofollow",
    };
  }

  // Build hierarchical breadcrumb for better SEO
  const lineage = getTagLineage(tagId);
  const breadcrumb = lineage.map((t) => t.name).join(" > ");

  // Create rich metadata
  const title = `${tagInfo.name} Leaderboard - AI Model Rankings`;
  const description = `Discover the top AI models for ${tagInfo.name.toLowerCase()}. ${tagInfo.description || "Compare model performance based on ELO ratings from head-to-head evaluations."}`;

  return {
    title,
    description,
    keywords: [
      "AI models",
      "leaderboard",
      "ELO ranking",
      "model evaluation",
      tagInfo.name,
      ...breadcrumb.split(" > "),
      "artificial intelligence",
      "language models",
      "performance comparison",
    ].join(", "),

    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Model Eval",
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: `${tagInfo.name} Model Leaderboard`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },

    // Structured data for search engines
    other: {
      "article:section": "Technology",
      "article:tag": tagInfo.name,
    },

    // Canonical URL to prevent duplicate content issues
    alternates: {
      canonical: `/leaderboard/capability/${tagId}`,
    },
  };
}
