import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { getExecutionResult } from "@/lib/router/result-persistence";
import type { RouterResultPageProps } from "@/types/components/router";

import { RouterResultDisplay } from "../components/RouterResultDisplay";
import { RouterResultSkeleton } from "../components/RouterResultSkeleton";

export async function generateMetadata({ params }: RouterResultPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // Use direct database call instead of HTTP request
    const result = await getExecutionResult(id);

    if (!result.success || !result.data) {
      return {
        title: "Router Result Not Found | Electric Pelican",
        description: "The requested router execution result could not be found.",
      };
    }

    // Enhanced metadata for better social sharing
    const truncatedPrompt =
      result.data.originalPrompt.length > 100
        ? result.data.originalPrompt.substring(0, 100) + "..."
        : result.data.originalPrompt;

    const executionDate = new Date(result.data.completedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return {
      title: `Router Result: ${truncatedPrompt} | Electric Pelican`,
      description: `See how different AI models performed on this task. Executed on ${executionDate} using intelligent model routing.`,
      openGraph: {
        title: `Router Result: ${truncatedPrompt}`,
        description: `AI model comparison and routing analysis from Electric Pelican`,
        type: "article",
        publishedTime: new Date(result.data.completedAt).toISOString(),
        images: [
          {
            url: "/api/og/router-result?id=" + id,
            width: 1200,
            height: 630,
            alt: "Router execution result preview",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `Router Result: ${truncatedPrompt}`,
        description: `See how different AI models performed on this task`,
        images: ["/api/og/router-result?id=" + id],
      },
      alternates: {
        canonical: `/router/${id}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for router result:", error);
    return {
      title: "Router Result | Electric Pelican",
      description: "View router execution results and model comparisons.",
    };
  }
}

export default async function RouterResultPage({ params }: RouterResultPageProps) {
  const { id } = await params;

  // Validate ID format
  if (!id || id.length < 5) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary
          fallback={
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                We encountered an error while loading this router result.
              </p>
              <Link
                href="/router"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🚀 Try Router
              </Link>
            </div>
          }
        >
          <Suspense fallback={<RouterResultSkeleton />}>
            <RouterResultContent resultId={id} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// Separate component for data fetching to enable Suspense
async function RouterResultContent({ resultId }: { resultId: string }) {
  try {
    // Use direct database call instead of HTTP request
    const result = await getExecutionResult(resultId);

    if (!result.success) {
      if (result.data === null) {
        notFound();
      }
      throw new Error(`Failed to fetch result: ${result.error || "Unknown error"}`);
    }

    if (!result.data) {
      notFound();
    }

    return <RouterResultDisplay result={result.data} isSharedResult={true} />;
  } catch (error) {
    console.error("Failed to load router result:", error);
    throw error; // Let ErrorBoundary handle it
  }
}
