"use client";

/**
 * @file RouterInterface - Main router interface component
 * @description Orchestrates the complete router workflow UI
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

import { useProgressStreaming } from "../hooks/useProgressStreaming";
import { useRouterState } from "../hooks/useRouterState";
import { ExecutionProgress } from "./ExecutionProgress";
import ModelSelectionPanel from "./ModelSelectionPanel";
import PromptInput from "./PromptInput";
import WorkflowVisualization from "./WorkflowVisualization";

/**
 * Main router interface component
 */
export default function RouterInterface() {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [hasExecutionStarted, setHasExecutionStarted] = useState(false);

  const { state, actions } = useRouterState();

  // Progress streaming for execution
  const {
    singleProgress,
    workflowProgress,
    intermediateResults,
    singleResult,
    workflowResult,
    isConnected,
    isExecuting,
    error: streamingError,
    cancelExecution,
    reset: resetProgress,
  } = useProgressStreaming(executionId);

  const handleAnalyze = () => {
    // Reset execution state when starting new analysis
    setExecutionId(null);
    setHasExecutionStarted(false);
    resetProgress();

    // Start the analysis with the current prompt
    actions.analyzePrompt(state.currentPrompt);
  };

  const handleExecute = async () => {
    if (
      !state.analysisResult ||
      !state.singleModelRecommendation ||
      !state.optimizedWorkflow?.length
    ) {
      return;
    }

    try {
      // Transform workflow steps to match execution API schema
      const transformedWorkflow = state.optimizedWorkflow.map((step: any, index: number) => ({
        id: step.id,
        description: step.description,
        requiredCapabilities: [step.primaryCapability], // Use primaryCapability as requiredCapabilities
        primaryCapability: step.primaryCapability,
        selectedModel: step.selectedModel,
        dependencies: step.dependencies || [],
        estimatedTokens: step.estimatedTokens || 150,
        priority: index + 1, // Add priority based on order
        ...(step.mergedSteps && { mergedSteps: step.mergedSteps }),
      }));

      const response = await fetch("/api/router/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: state.currentPrompt,
          workflow: transformedWorkflow,
          singleModelRecommendation: state.singleModelRecommendation,
          options: {
            includeIntermediateResults: true,
            maxRetries: 2,
            timeout: 300000, // 5 minutes
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Execution API error:", errorData);
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Execution failed");
      }

      setExecutionId(result.data.executionId);
      setHasExecutionStarted(true);
    } catch (error) {
      console.error("Failed to start execution:", error);
    }
  };

  const handleReset = () => {
    setExecutionId(null);
    setHasExecutionStarted(false);
    resetProgress();
    actions.reset();
  };

  const canExecute =
    state.analysisResult &&
    state.singleModelRecommendation &&
    state.optimizedWorkflow?.length &&
    !state.isAnalyzing &&
    !state.isOptimizing;

  return (
    <div className="space-y-6">
      {/* Prompt Input Section */}
      <PromptInput
        promptInput={state.currentPrompt}
        isAnalyzing={state.isAnalyzing}
        analysisError={state.analysisError}
        onPromptChange={actions.setPrompt}
        onAnalyze={handleAnalyze}
        onClear={handleReset}
      />

      {/* Results Section - Show after analysis starts */}
      {(state.analysisResult || state.isAnalyzing) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow Breakdown */}
          <WorkflowVisualization
            workflow={state.optimizedWorkflow || []}
            isOptimizing={state.isOptimizing}
            selectedStep={state.selectedStep}
            onStepSelect={actions.selectStep}
            selectionError={state.selectionError}
          />

          {/* Single Model Recommendation */}
          <ModelSelectionPanel
            recommendation={state.singleModelRecommendation}
            isOptimizing={state.isOptimizing}
            selectionError={state.selectionError}
          />
        </div>
      )}

      {/* Analysis Results Summary & Execute Button */}
      {state.analysisResult && !state.isAnalyzing && !hasExecutionStarted && (
        <GlassPanel className="p-6">
          <div className="text-center space-y-4">
            <h4 className="font-medium text-gray-900 mb-2">Analysis Complete</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-4">
              <span>📊 {state.optimizedWorkflow?.length || 0} workflow steps identified</span>
              <span>🎯 {state.singleModelRecommendation ? "1" : "0"} model recommended</span>
              <span>⚡ {state.analysisResult.workflow.length} capabilities analyzed</span>
            </div>

            {canExecute && (
              <Button
                onClick={handleExecute}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                🚀 Execute Both Approaches
              </Button>
            )}

            {(state.selectionError || state.analysisError) && (
              <div className="text-red-600 text-sm mt-2">
                Unable to execute: {state.selectionError || state.analysisError}
              </div>
            )}
          </div>
        </GlassPanel>
      )}

      {/* Execution Progress */}
      {hasExecutionStarted && executionId && (
        <ExecutionProgress
          executionId={executionId}
          singleProgress={singleProgress}
          workflowProgress={workflowProgress}
          intermediateResults={intermediateResults}
          singleResult={singleResult}
          workflowResult={workflowResult}
          isExecuting={isExecuting}
          isConnected={isConnected}
          onCancel={cancelExecution}
        />
      )}

      {/* Streaming Error */}
      {streamingError && (
        <GlassPanel className="p-4 border-red-200 bg-red-50">
          <div className="text-red-800 text-sm">
            <strong>Execution Error:</strong> {streamingError}
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="mt-2">
            Reset and Try Again
          </Button>
        </GlassPanel>
      )}

      {/* New Execution Button */}
      {hasExecutionStarted && !isExecuting && (
        <div className="text-center">
          <Button onClick={handleReset} variant="outline" size="lg" className="px-8 py-3">
            🔄 Start New Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
