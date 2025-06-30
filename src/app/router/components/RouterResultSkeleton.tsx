"use client";

import { GlassPanel } from "@/components/ui/glass-panel";

export function RouterResultSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </GlassPanel>

      {/* Prompt skeleton */}
      <GlassPanel className="p-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      </GlassPanel>

      {/* Analysis skeleton */}
      <GlassPanel className="p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="space-y-3">
              <div className="h-16 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </GlassPanel>

      {/* Results skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </GlassPanel>
      </div>

      {/* ELO context skeleton */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </GlassPanel>
    </div>
  );
}
