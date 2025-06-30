import { NextResponse } from "next/server";

import { hierarchicalELOMetrics } from "@/lib/hierarchical-elo-metrics";

/**
 * GET /api/health/hierarchical-elo
 *
 * Health check endpoint for hierarchical ELO system.
 * Returns performance metrics, system status, and recommendations.
 */
export async function GET() {
  try {
    // Test basic functionality with a simple query
    const start = performance.now();

    // Lazy import to avoid build-time issues - updated to new ELO structure
    const { getTagLeaderboard } = await import("@/lib/elo");

    // Perform a lightweight test query
    await getTagLeaderboard("scene-understanding", { limit: 1 });
    const queryTime = performance.now() - start;

    // Get performance metrics
    const stats = hierarchicalELOMetrics.getStats();
    const health = hierarchicalELOMetrics.getHealthStatus();

    // Perform system checks
    const checks = {
      database: queryTime < 100 ? "pass" : queryTime < 500 ? "warn" : "fail",
      performance:
        stats.queryTimes.p95 < 100 ? "pass" : stats.queryTimes.p95 < 500 ? "warn" : "fail",
      errors: health.status === "healthy" ? "pass" : health.status === "warning" ? "warn" : "fail",
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? "pass" : "warn", // 500MB threshold
    };

    // Determine overall status
    const hasFailures = Object.values(checks).includes("fail");
    const hasWarnings = Object.values(checks).includes("warn");
    const overallStatus = hasFailures ? "unhealthy" : hasWarnings ? "degraded" : "healthy";

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      performance: {
        lastQueryTime: queryTime,
        ...stats,
      },
      health,
      checks,
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
      recommendations: health.recommendations,
    });
  } catch (error) {
    // Record the error in metrics
    hierarchicalELOMetrics.recordError("health-check");

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks: {
          database: "fail",
          performance: "unknown",
          errors: "fail",
          memory: "unknown",
        },
        recommendations: [
          "Check database connectivity",
          "Review system logs for errors",
          "Verify hierarchical ELO service configuration",
        ],
      },
      { status: 500 },
    );
  }
}
