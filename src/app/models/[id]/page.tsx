"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import useSWR from "swr";

import { EvaluationHistory } from "@/components/models/profile/EvaluationHistory";
import { ModelHeader } from "@/components/models/profile/ModelHeader";
import { TagPerformanceChart } from "@/components/models/profile/TagPerformanceChart";
import { ElectricButton } from "@/components/ui/electric-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ModelPageParams, ResolvedModelPageParams } from "@/types/pages";

// Simple fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Model not found");
    }
    throw new Error(`Failed to fetch model data: ${response.status}`);
  }
  return response.json();
};

export default function ModelProfilePage({ params }: ModelPageParams) {
  // Unwrap params Promise using React.use()
  const resolvedParams = use(params) as ResolvedModelPageParams;

  // Get the model ID (could be string or array) and ensure it's a string
  const rawId = resolvedParams.id;
  const modelId = decodeURIComponent(Array.isArray(rawId) ? rawId.join("/") : rawId);

  // Fetch model statistics
  const {
    data: modelStats,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR(`/api/models/${modelId}/stats`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });

  // Fetch evaluation history
  const {
    data: evaluationHistory,
    error: evalError,
    isLoading: evalLoading,
  } = useSWR(`/api/models/${modelId}/evaluations`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  // Handle errors
  if (statsError?.message === "Model not found" || evalError?.message === "Model not found") {
    notFound();
  }

  // Error state
  if (statsError || evalError) {
    return (
      <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8 items-center justify-center">
        <GlassPanel className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-headline text-brand-red mb-4">Error Loading Model Profile</h1>
          <p className="text-body text-brand-gray-04 mb-6">
            Failed to load model information. Please try again.
          </p>
          <ElectricButton onClick={() => mutateStats()} className="w-full sm:w-auto">
            Retry
          </ElectricButton>
        </GlassPanel>
      </div>
    );
  }

  // Loading state
  if (statsLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* Header skeleton */}
          <GlassPanel className="p-6">
            <div className="animate-pulse">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-8 bg-brand-gray-02 rounded w-64"></div>
                  <div className="h-4 bg-brand-gray-02 rounded w-32"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 bg-brand-gray-02 rounded w-16"></div>
                  <div className="h-3 bg-brand-gray-02 rounded w-20"></div>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Tag Performance skeleton */}
          <GlassPanel className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-brand-gray-02 rounded w-40 mb-4"></div>
              <div className="h-64 bg-brand-gray-02 rounded"></div>
            </div>
          </GlassPanel>

          {/* Content skeleton */}
          <GlassPanel className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-brand-gray-02 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-brand-gray-02 rounded"></div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Model Header */}
        <ModelHeader modelStats={modelStats} />

        {/* Tag Performance Chart */}
        <TagPerformanceChart modelId={modelId} />

        {/* Evaluation History */}
        <EvaluationHistory
          modelId={modelId}
          evaluationHistory={evaluationHistory}
          isLoading={evalLoading}
        />

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-label text-brand-gray-03">
            Statistics are updated in real-time based on evaluation results
          </p>
        </div>
      </div>
    </div>
  );
}
