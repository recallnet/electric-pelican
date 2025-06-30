"use client";

import { useState } from "react";

import { JudgePromptEditor } from "@/components/tournament";

/**
 * Demo page for judge prompt editor.
 * Shows the complete judge prompt generation and editing flow.
 */
export default function JudgePage() {
  const [challengePrompt, setChallengePrompt] = useState(
    "Write a creative short story about a robot discovering art for the first time. Include vivid descriptions and emotional depth.",
  );
  const [judgePrompt, setJudgePrompt] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Challenge Prompt Display */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Current Challenge Prompt</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700">{challengePrompt}</p>
          </div>
          <div className="mt-4">
            <label
              htmlFor="challenge-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Edit Challenge Prompt:
            </label>
            <textarea
              id="challenge-input"
              value={challengePrompt}
              onChange={(e) => setChallengePrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your challenge prompt..."
            />
          </div>
        </div>

        {/* Judge Prompt Editor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <JudgePromptEditor
            challengePrompt={challengePrompt}
            onPromptChange={(prompt) => {
              console.log("Judge prompt changed:", prompt);
              setJudgePrompt(prompt);
            }}
          />
        </div>

        {/* Current Judge Prompt Display */}
        {judgePrompt && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Current Judge Instructions</h3>
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <p className="text-green-800 whitespace-pre-wrap">{judgePrompt}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              These instructions will be used by the AI judge to evaluate model responses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
