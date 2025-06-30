"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";

import { GlassPanel } from "@/components/ui/glass-panel";
import { getTagInfo } from "@/lib/tag-taxonomy";
import { type TagELOData, type TagPerformanceChartProps } from "@/types/components";

// Register the required chart components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  RadarController,
);

export const TagPerformanceChart: React.FC<TagPerformanceChartProps> = ({ modelId, className }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tagData, setTagData] = useState<TagELOData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTagPerformance = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/models/${encodeURIComponent(modelId)}/tag-scores?minMatches=3`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch tag performance data: ${response.statusText}`);
        }

        const data = await response.json();
        setTagData(data.tagScores);
        setError(null);
      } catch (err) {
        console.error("Error fetching tag performance:", err);
        setError(err instanceof Error ? err.message : "Failed to load tag performance data");
        setTagData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (modelId) {
      fetchTagPerformance();
    }
  }, [modelId]);

  // Format data for chart display, selecting top 5 and bottom 5 capabilities by rank
  const prepareChartData = () => {
    if (!tagData.length) return { labels: [], datasets: [] };

    // Sort by rank (1 = best, higher = worse)
    const sortedByRank = [...tagData].sort((a, b) => a.rank - b.rank);

    // Get top 5 capabilities (best ranks)
    const topTags = sortedByRank.slice(0, Math.min(5, sortedByRank.length));

    // Get bottom 5 capabilities (worst ranks) - but only if we have more than 5 total
    const bottomTags =
      sortedByRank.length > 5 ? sortedByRank.slice(-Math.min(5, sortedByRank.length)) : [];

    // Combine tags (remove duplicates if there's overlap)
    const allSelectedTags = [...topTags];
    bottomTags.forEach((tag) => {
      if (!allSelectedTags.find((t) => t.tagId === tag.tagId)) {
        allSelectedTags.push(tag);
      }
    });

    // Prepare labels using tag names - no truncation for full readability
    const labels = allSelectedTags.map((item) => item.tagName);

    // Convert ranks to chart values (invert so higher = better on chart)
    // Use a scale where rank 1 = 100, and scale down from there
    const maxRank = Math.max(...allSelectedTags.map((t) => t.rank));
    const chartValues = allSelectedTags.map((item) => {
      // Invert rank so rank 1 = highest value
      return Math.max(0, 100 - ((item.rank - 1) / maxRank) * 80); // Scale from 20-100
    });

    // Color based on whether it's a top capability or bottom capability
    const backgroundColors = allSelectedTags.map((item) => {
      const isTopCapability = topTags.some((t) => t.tagId === item.tagId);
      return isTopCapability
        ? "rgba(34, 197, 94, 0.5)" // Green for top capabilities
        : "rgba(239, 68, 68, 0.5)"; // Red for bottom capabilities
    });

    const borderColors = allSelectedTags.map((item) => {
      const isTopCapability = topTags.some((t) => t.tagId === item.tagId);
      return isTopCapability
        ? "rgba(34, 197, 94, 1)" // Green for top capabilities
        : "rgba(239, 68, 68, 1)"; // Red for bottom capabilities
    });

    return {
      labels,
      datasets: [
        {
          label: "Ranking Performance",
          data: chartValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
      getTooltipLabel: (index: number) => {
        const item = allSelectedTags[index];
        if (!item) return ["No data available"];

        const tooltipLines = [];

        // Show tag hierarchy if available
        if (item.parentTagId) {
          const parentInfo = getTagInfo(item.parentTagId);
          if (parentInfo) {
            tooltipLines.push(`Category: ${parentInfo.name}`);
          }
        }

        tooltipLines.push(
          `Capability: ${item.tagName}`,
          `Rank: #${item.rank} of ${item.totalModelsForTag} models`,
          `ELO Score: ${item.eloScore}`,
          `Win Rate: ${Math.round(item.winRate * 100)}% (${item.wins}W/${item.losses}L)`,
          `Matches: ${item.matchesPlayed}`,
        );

        return tooltipLines;
      },
    };
  };

  const chartData = prepareChartData();

  const chartOptions = {
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          backdropColor: "transparent",
          callback: function (tickValue: string | number) {
            const value = typeof tickValue === "string" ? parseFloat(tickValue) : tickValue;
            // Show rank indicators instead of raw values
            if (value === 100) return "Top Rank";
            if (value === 80) return "High";
            if (value === 60) return "Mid";
            if (value === 40) return "Low";
            if (value === 20) return "Bottom";
            return "";
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Dark grid lines for visibility
        },
        pointLabels: {
          font: {
            size: 10,
            weight: "normal",
          },
          color: "#1f2937", // Dark gray for visibility on light background
          padding: 15,
          callback: function (label: string, _index: number) {
            // Wrap long labels across multiple lines for better readability
            if (label.length > 15) {
              const words = label.split(" ");
              if (words.length > 1) {
                const mid = Math.ceil(words.length / 2);
                return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
              }
              // For single long words, break at reasonable points
              if (label.length > 20) {
                return [label.substring(0, 15), label.substring(15)];
              }
            }
            return label;
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: { dataIndex: number }) {
            return chartData?.getTooltipLabel?.(context.dataIndex) ?? ["No data available"];
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  } as any;

  if (isLoading) {
    return (
      <GlassPanel className={`p-4 w-full h-64 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-brand-gray-02 rounded w-40 mb-4"></div>
          <div className="h-[calc(100%-42px)] bg-brand-gray-02 rounded"></div>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-64 flex items-center justify-center ${className}`}>
        <p className="text-sm text-gray-400">Unable to load tag performance data</p>
      </div>
    );
  }

  if (tagData.length === 0) {
    return (
      <div className={`w-full h-64 flex items-center justify-center ${className}`}>
        <p className="text-sm text-gray-400">
          Not enough evaluation data by tag to display performance chart
        </p>
      </div>
    );
  }

  return (
    <GlassPanel className={`p-4 w-full h-128 ${className}`}>
      <div className="mb-2">
        <h3 className="text-lg font-medium text-brand-black">Top & Bottom Capabilities</h3>
      </div>
      <div className="h-[calc(100%-42px)]">
        <Radar data={chartData} options={chartOptions} />
      </div>
    </GlassPanel>
  );
};

export default TagPerformanceChart;
