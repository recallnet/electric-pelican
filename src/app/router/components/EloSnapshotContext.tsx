"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { ModelEloData } from "@/types/router-results";

interface ModelEloContextProps {
  modelEloData: ModelEloData;
}

export function EloSnapshotContext({ modelEloData }: ModelEloContextProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const totalModels = Object.keys(modelEloData.models).length;
  const totalTagScores = Object.values(modelEloData.tagScores).reduce(
    (sum, tagModels) => sum + Object.keys(tagModels).length,
    0,
  );

  return (
    <GlassPanel className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Model ELO Context</h3>
            <p className="text-sm text-gray-600">
              ELO scores for models used in this execution, captured at:{" "}
              {format(new Date(modelEloData.capturedAt), "PPpp")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
            {process.env.NODE_ENV === "development" && (
              <Button variant="ghost" size="sm" onClick={() => setShowRawData(!showRawData)}>
                Raw Data
              </Button>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary">📊 {totalModels} models</Badge>
          <Badge variant="secondary">🏷️ {totalTagScores} capability scores</Badge>
          <Badge variant="secondary">
            📅 {format(new Date(modelEloData.capturedAt), "MMM d, yyyy")}
          </Badge>
        </div>

        {/* Important notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>📌 Historical Context:</strong> These are the ELO scores for the specific models
            that were used in this router execution. Current scores may have changed due to new
            evaluations.
          </p>
        </div>

        {/* Detailed breakdown (collapsible) */}
        {showDetails && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Models Used (at execution time)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {Object.values(modelEloData.models)
                  .sort((a, b) => b.globalScore - a.globalScore)
                  .map((model) => (
                    <div
                      key={model.modelId}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs"
                    >
                      <div>
                        <span className="font-medium">{model.name}</span>
                        <span className="text-gray-500 ml-2">({model.provider})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600">{model.globalScore} ELO</div>
                        <div className="text-gray-500">
                          {model.wins}W/{model.losses}L
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Capability Coverage</h4>
              <div className="text-sm text-gray-600">
                <p>
                  This execution used scores from {Object.keys(modelEloData.tagScores).length}{" "}
                  different model-capability combinations.
                </p>
                <p>
                  These scores influenced the routing decisions made on{" "}
                  {format(new Date(modelEloData.capturedAt), "PPP")}.
                </p>
              </div>

              {/* Tag breakdown */}
              <div className="mt-2 space-y-2">
                {Object.entries(modelEloData.tagScores)
                  .slice(0, 5)
                  .map(([modelId, tags]) => {
                    const model = modelEloData.models[modelId];
                    return (
                      <div key={modelId} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{model?.name || modelId}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(tags).map(([tagId, score]) => (
                            <Badge key={tagId} variant="outline" className="text-xs">
                              {tagId}: {score.eloScore}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(modelEloData.tagScores).length > 5 && (
                  <div className="text-xs text-gray-500">
                    +{Object.keys(modelEloData.tagScores).length - 5} more models with capability
                    scores
                  </div>
                )}
              </div>
            </div>

            {/* Type iteration feedback */}
            {process.env.NODE_ENV === "development" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h5 className="font-medium text-blue-800 mb-1">💡 Real Data Notes</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Now using real ELO data from the database</li>
                  <li>• Only models used in this execution are included</li>
                  <li>• Scores reflect the exact state when routing decisions were made</li>
                  <li>• This replaces the full snapshot approach for better performance</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Raw data view (development only) */}
        {showRawData && process.env.NODE_ENV === "development" && (
          <details className="border-t pt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Raw Model ELO Data
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(modelEloData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </GlassPanel>
  );
}
