import Link from "next/link";

import { ElectricButton } from "@/components/ui/electric-button";
import { GlassPanel } from "@/components/ui/glass-panel";

/**
 * Not found page for invalid model IDs.
 * Provides helpful navigation options and suggests alternatives.
 */
export default function ModelNotFound() {
  return (
    <div className="min-h-screen bg-brand-white flex flex-col py-8 px-4 md:px-8 items-center justify-center">
      <GlassPanel className="max-w-md mx-auto p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-brand-gray-01 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-brand-gray-03"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-headline text-brand-black mb-4">Model Not Found</h1>
        <p className="text-body text-brand-gray-04 mb-6">
          The model you&apos;re looking for doesn&apos;t exist or hasn&apos;t participated in any
          evaluations yet.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/leaderboard">
            <ElectricButton className="w-full">Browse Leaderboard</ElectricButton>
          </Link>

          <Link href="/eval/setup">
            <ElectricButton variant="outline" className="w-full">
              Create Evaluation
            </ElectricButton>
          </Link>

          <Link href="/">
            <ElectricButton variant="ghost" className="w-full">
              Go Home
            </ElectricButton>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-label text-brand-gray-03">
            Models appear in profiles after participating in at least one evaluation
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
