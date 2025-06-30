"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { RouterExecutionResult } from "@/types/router-results";

interface MobileOptimizedDisplayProps {
  result: RouterExecutionResult;
}

export function MobileOptimizedDisplay({ result }: MobileOptimizedDisplayProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "analysis" | "results" | "context">(
    "prompt",
  );

  const tabs = [
    { id: "prompt", label: "📝 Prompt", icon: "📝" },
    { id: "analysis", label: "🔍 Analysis", icon: "🔍" },
    { id: "results", label: "🎯 Results", icon: "🎯" },
    { id: "context", label: "📊 Context", icon: "📊" },
  ] as const;

  return (
    <div className="md:hidden space-y-4">
      {/* Mobile tab navigation */}
      <GlassPanel className="p-2">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label.split(" ")[1]}</span>
            </Button>
          ))}
        </div>
      </GlassPanel>

      {/* Mobile tab content */}
      <div className="space-y-4">
        {activeTab === "prompt" && (
          <GlassPanel className="p-4">
            <h3 className="font-semibold mb-3 text-gray-900">Original Prompt</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{result.originalPrompt}</div>
          </GlassPanel>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-4">
            <GlassPanel className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Workflow Analysis</h3>
              <div className="space-y-2">
                {result.optimizedWorkflow.map((step, index) => (
                  <div key={step.id} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm">Step {index + 1}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {step.selectedModel?.modelName}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Single Model</h3>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium text-sm">
                  {result.singleModelRecommendation.modelName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {result.singleModelRecommendation.reasoning}
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        {activeTab === "results" && (
          <div className="space-y-4">
            {result.singleResult && (
              <GlassPanel className="p-4">
                <h3 className="font-semibold mb-3 text-gray-900">Single Model Result</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.singleResult.finalResult}
                </div>
              </GlassPanel>
            )}

            {result.workflowResult && (
              <GlassPanel className="p-4">
                <h3 className="font-semibold mb-3 text-gray-900">Workflow Result</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.workflowResult.finalResult}
                </div>
              </GlassPanel>
            )}
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-4">
            <GlassPanel className="p-4">
              <h3 className="font-semibold mb-3 text-gray-900">Model ELO Context</h3>
              <div className="text-sm text-gray-600 mb-3">
                Captured on {new Date(result.modelEloData.capturedAt).toLocaleDateString()}
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {Object.keys(result.modelEloData.models).length}
                  </div>
                  <div className="text-xs text-gray-600">Models</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {Object.values(result.modelEloData.tagScores).reduce(
                      (total, modelTags) => total + Object.keys(modelTags).length,
                      0,
                    )}
                  </div>
                  <div className="text-xs text-gray-600">Tag Relations</div>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}
