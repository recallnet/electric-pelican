import type { Metadata } from "next";

import type { SingleModelMetadataParams as Props } from "@/types/pages";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const modelId = decodeURIComponent(id);

  // Format model name for display
  const formatModelName = (modelId: string): string => {
    const parts = modelId.split("/");
    const modelName = parts[parts.length - 1] || modelId;

    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const modelName = formatModelName(modelId);
  const title = `${modelName} - AI Model Profile | Savant`;
  const description = `View detailed performance metrics, ELO ratings, and evaluation history for ${modelName}. Compare against other AI models in head-to-head competitions.`;

  return {
    title,
    description,
    keywords: [
      modelName,
      "AI model evaluation",
      "model performance",
      "ELO rating",
      "AI comparison",
      "model benchmarking",
      "artificial intelligence",
      "language model",
      "Savant",
    ],
    authors: [{ name: "Recall (Labs)" }],
    openGraph: {
      title,
      description: `Detailed performance analysis for ${modelName} including ELO ratings and head-to-head evaluation results.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Performance metrics and evaluation history for ${modelName}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
