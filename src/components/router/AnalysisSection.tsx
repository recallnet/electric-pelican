/**
 * @file Analysis Section Component
 * @description Main analysis interface with authentication gating
 */

import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";

import { usePromptPersistence } from "@/hooks/usePromptPersistence";
import { useRouterAuth } from "@/hooks/useRouterAuth";

import { AuthenticatedAnalyzeButton } from "./AuthenticatedAnalyzeButton";
import { AuthPrompt } from "./AuthPrompt";
import { UnauthenticatedAnalyzeButton } from "./UnauthenticatedAnalyzeButton";

/**
 * Analysis section component with authentication gating
 */
export function AnalysisSection() {
  const { isAuthenticated, requireAuth } = useRouterAuth();
  const { getAccessToken } = usePrivy();
  const { prompt, setPrompt } = usePromptPersistence();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call the router analyze API with authentication
   */
  const callAnalyzeAPI = async (prompt: string) => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("Failed to get authentication token");
    }

    const response = await fetch("/api/router/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Analysis failed");
    }

    return response.json();
  };

  /**
   * Handle analyze button click
   */
  const handleAnalyze = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    requireAuth(async () => {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      try {
        console.log("Analyzing prompt:", prompt);
        const result = await callAnalyzeAPI(prompt);
        setAnalysisResult(result);
        console.log("Analysis complete:", result);
      } catch (error) {
        console.error("Analysis failed:", error);
        setError(error instanceof Error ? error.message : "Analysis failed");
      } finally {
        setIsAnalyzing(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-label text-brand-gray-03 uppercase">
          Enter Your Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here to get intelligent model recommendations..."
          className="w-full p-4 border border-brand-gray-01 rounded-lg min-h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          rows={4}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-body">{error}</p>
        </div>
      )}

      {/* Authentication Prompt (shown when user tries to analyze without auth) */}
      {showAuthPrompt && !isAuthenticated && (
        <div className="mb-4">
          <AuthPrompt />
        </div>
      )}

      {/* Analysis Button */}
      <div className="flex justify-center">
        {isAuthenticated ? (
          <AuthenticatedAnalyzeButton
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={!prompt.trim()}
          />
        ) : (
          <UnauthenticatedAnalyzeButton />
        )}
      </div>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-body text-brand-gray-04">
          {isAuthenticated
            ? "Ready to analyze your prompt with AI-powered model routing"
            : "Sign in to unlock AI Router analysis powered by real evaluation data"}
        </p>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mt-8 space-y-4">
          <h3 className="text-headline text-brand-black">Analysis Results</h3>

          <div className="glassmorphism-25 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-body font-semibold text-brand-black mb-2">
                  Single Model Recommendation
                </h4>
                <p className="text-body text-brand-gray-04">
                  {analysisResult.data?.singleModelRecommendation?.model || "Not available"}
                </p>
              </div>

              <div>
                <h4 className="text-body font-semibold text-brand-black mb-2">Workflow Analysis</h4>
                <p className="text-body text-brand-gray-04">
                  {analysisResult.data?.workflow?.length || 0} workflow steps identified
                </p>
              </div>

              <div>
                <h4 className="text-body font-semibold text-brand-black mb-2">Analysis Time</h4>
                <p className="text-body text-brand-gray-04">
                  {analysisResult.data?.analysisTime || 0}ms
                </p>
              </div>

              <div>
                <h4 className="text-body font-semibold text-brand-black mb-2">
                  Estimated Complexity
                </h4>
                <p className="text-body text-brand-gray-04">
                  {analysisResult.data?.estimatedComplexity || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
