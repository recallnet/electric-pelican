"use client";

/**
 * @file Router Page - AI Router interface
 * @description Main page for the AI routing functionality
 */

import RouterInterface from "./components/RouterInterface";

/**
 * Main router page component
 */
export default function RouterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Router</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enter your prompt to get intelligent model recommendations based on real evaluation
              data. Compare workflow breakdown vs single-model approaches.
            </p>
          </div>

          {/* Main Router Interface */}
          <RouterInterface />
        </div>
      </div>
    </div>
  );
}
