"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { UnavailableModel, UnavailableModelsResponse } from "@/types/admin";

export default function AdminModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<UnavailableModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingModelId, setProcessingModelId] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/models");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (response.status === 403) {
          setError("Admin access required");
          return;
        }
        throw new Error("Failed to fetch models");
      }

      const data: UnavailableModelsResponse = await response.json();
      setModels(data.models);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const toggleModelAvailability = async (modelId: string, makeAvailable: boolean) => {
    try {
      setProcessingModelId(modelId);

      const response = await fetch("/api/admin/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          makeAvailable,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update model");
      }

      // Refresh the list
      await fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update model");
    } finally {
      setProcessingModelId(null);
    }
  };

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto"></div>
            <p className="text-label text-brand-gray-03">Loading models...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <GlassPanel className="max-w-md mx-auto p-6">
          <h3 className="text-headline text-brand-red mb-2">Error</h3>
          <p className="text-body text-brand-red mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry
          </Button>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-display text-brand-black mb-2">Admin: Unavailable Models</h1>
        <p className="text-body text-brand-gray-04">
          Manage models that are currently marked as unavailable
        </p>
      </div>

      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline text-brand-black">Unavailable Models ({models.length})</h2>
          <Button onClick={fetchModels} variant="outline">
            Refresh
          </Button>
        </div>

        {models.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-body text-brand-gray-04">
              No unavailable models found. All models are currently available!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-brand-gray-01">
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Model ID</th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Provider</th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Failures</th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">
                    Marked Unavailable
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-brand-gray-04">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-brand-gray-01 hover:bg-brand-gray-00"
                  >
                    <td className="py-3 px-4 font-mono text-sm">{model.id}</td>
                    <td className="py-3 px-4">{model.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{model.provider}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={model.failure_count > 0 ? "destructive" : "secondary"}>
                        {model.failure_count}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-gray-03">
                      {formatDate(model.marked_unavailable_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-gray-03 max-w-xs truncate">
                      {model.unavailable_reason || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => toggleModelAvailability(model.id, true)}
                        disabled={processingModelId === model.id}
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        {processingModelId === model.id ? "Restoring..." : "Restore"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
