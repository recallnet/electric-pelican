"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";

export default function AdminDashboardPage() {
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-display text-brand-black mb-2">Admin Dashboard</h1>
        <p className="text-body text-brand-gray-04">
          Manage and monitor the Electric Pelican platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Model Management */}
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-headline text-brand-black">Model Management</h3>
              <p className="text-sm text-brand-gray-03">Manage model availability</p>
            </div>
          </div>

          <p className="text-body text-brand-gray-04 mb-4">
            View and restore models that have been marked as unavailable due to failures or API
            removal.
          </p>

          <Link
            href="/admin/models"
            className="inline-flex items-center text-brand-blue hover:text-brand-blue-dark font-medium"
          >
            Manage Models
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </GlassPanel>

        {/* System Status */}
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-headline text-brand-black">System Status</h3>
              <p className="text-sm text-brand-gray-03">Platform health</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-gray-04">API Status</span>
              <Badge variant="default" className="bg-green-500">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-gray-04">Database</span>
              <Badge variant="default" className="bg-green-500">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-gray-04">OpenRouter</span>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
          </div>

          <p className="text-xs text-brand-gray-03">All systems operational</p>
        </GlassPanel>

        {/* Quick Actions */}
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-headline text-brand-black">Quick Actions</h3>
              <p className="text-sm text-brand-gray-03">Common admin tasks</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full text-left p-2 rounded border border-brand-gray-01 hover:bg-brand-gray-00 text-sm">
              Sync OpenRouter Models
            </button>
            <button className="w-full text-left p-2 rounded border border-brand-gray-01 hover:bg-brand-gray-00 text-sm">
              Clear Cache
            </button>
            <button className="w-full text-left p-2 rounded border border-brand-gray-01 hover:bg-brand-gray-00 text-sm">
              View Logs
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
