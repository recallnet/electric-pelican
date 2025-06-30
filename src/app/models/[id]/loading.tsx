import { GlassPanel } from "@/components/ui/glass-panel";

/**
 * Loading page for model profile showing skeleton screens
 * while model statistics and evaluation data are being fetched.
 */
export default function ModelProfileLoading() {
  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header skeleton */}
        <GlassPanel className="p-6">
          <div className="animate-pulse">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="h-8 bg-brand-gray-02 rounded w-64"></div>
                    <div className="h-4 bg-brand-gray-02 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-brand-gray-02 rounded w-20"></div>
                </div>
                <div className="h-4 bg-brand-gray-02 rounded w-40"></div>
              </div>
              <div className="text-center lg:text-right space-y-2">
                <div className="h-8 bg-brand-gray-02 rounded w-24"></div>
                <div className="h-3 bg-brand-gray-02 rounded w-20"></div>
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-6 bg-brand-gray-02 rounded w-12 mx-auto"></div>
                  <div className="h-3 bg-brand-gray-02 rounded w-16 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Navigation tabs skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-brand-gray-02 rounded w-32 animate-pulse"></div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Chart section */}
          <GlassPanel className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-brand-gray-02 rounded w-40 mb-4"></div>
              <div className="h-64 bg-brand-gray-01/30 rounded-lg"></div>
            </div>
          </GlassPanel>

          {/* Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <GlassPanel key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-brand-gray-02 rounded w-48 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-4 bg-brand-gray-02 rounded"></div>
                    ))}
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
