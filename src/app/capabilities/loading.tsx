import { GlassPanel } from "@/components/ui/glass-panel";

/**
 * Loading component for the Taxonomy page.
 * Shows skeleton loaders that match the expected layout structure.
 */
export default function TaxonomyLoading() {
  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col space-y-6">
        {/* Header Skeleton */}
        <div className="text-center space-y-2">
          <div className="h-12 bg-brand-gray-01 rounded w-96 mx-auto animate-pulse"></div>
          <div className="h-6 bg-brand-gray-01 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>

        {/* Stats Bar Skeleton */}
        <GlassPanel className="p-6">
          <div className="flex justify-center space-x-8 text-center">
            <div className="space-y-2">
              <div className="h-8 bg-brand-gray-01 rounded w-16 mx-auto animate-pulse"></div>
              <div className="h-4 bg-brand-gray-01 rounded w-20 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-brand-gray-01 rounded w-16 mx-auto animate-pulse"></div>
              <div className="h-4 bg-brand-gray-01 rounded w-24 mx-auto animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-brand-gray-01 rounded w-20 mx-auto animate-pulse"></div>
              <div className="h-4 bg-brand-gray-01 rounded w-28 mx-auto animate-pulse"></div>
            </div>
          </div>
        </GlassPanel>

        {/* Tree Skeleton */}
        <div className="space-y-4">
          {/* L1 Pillar Skeletons */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              {/* Main Pillar */}
              <GlassPanel className="p-4 border-brand-blue/30 bg-brand-blue/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 bg-brand-gray-01 rounded animate-pulse"></div>
                    <div className="h-6 bg-brand-gray-01 rounded w-64 animate-pulse"></div>
                  </div>
                  <div className="h-5 w-5 bg-brand-gray-01 rounded animate-pulse"></div>
                </div>

                <div className="h-4 bg-brand-gray-01 rounded w-3/4 mb-3 animate-pulse"></div>

                <div className="flex items-center justify-between mb-3 p-3 bg-white/20 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 bg-brand-gray-01 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-brand-gray-01 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-brand-gray-01 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-brand-gray-01 rounded w-20 animate-pulse"></div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="h-3 bg-brand-gray-01 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-brand-gray-01 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-brand-gray-01 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-brand-gray-01 rounded w-32 animate-pulse"></div>
                </div>
              </GlassPanel>

              {/* L2 Family Skeletons (indented) */}
              {i <= 3 && (
                <div className="ml-6 space-y-3">
                  {[1, 2].map((j) => (
                    <GlassPanel key={j} className="p-4 border-brand-green/30 bg-brand-green/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-5 w-5 bg-brand-gray-01 rounded animate-pulse"></div>
                          <div className="h-5 bg-brand-gray-01 rounded w-48 animate-pulse"></div>
                        </div>
                        <div className="h-4 w-4 bg-brand-gray-01 rounded animate-pulse"></div>
                      </div>

                      <div className="h-3 bg-brand-gray-01 rounded w-2/3 mb-3 animate-pulse"></div>

                      <div className="flex items-center justify-between mb-2 p-2 bg-white/20 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 bg-brand-gray-01 rounded w-20 animate-pulse"></div>
                          <div className="h-3 bg-brand-gray-01 rounded w-24 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-brand-gray-01 rounded w-16 animate-pulse"></div>
                      </div>

                      <div className="flex gap-3">
                        <div className="h-3 bg-brand-gray-01 rounded w-12 animate-pulse"></div>
                        <div className="h-3 bg-brand-gray-01 rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-brand-gray-01 rounded w-20 animate-pulse"></div>
                      </div>
                    </GlassPanel>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="text-center mt-8">
          <div className="h-4 bg-brand-gray-01 rounded w-96 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
