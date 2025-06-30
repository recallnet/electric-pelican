/**
 * Performance monitoring for hierarchical ELO operations.
 * Tracks metrics like update times, query times, and error rates.
 */
class HierarchicalELOMetrics {
  private updateTimes: number[] = [];
  private queryTimes: number[] = [];
  private errorCounts = new Map<string, number>();

  /**
   * Record time taken for an ELO update operation.
   * @param duration - Time in milliseconds
   */
  recordUpdateTime(duration: number): void {
    this.updateTimes.push(duration);
    // Keep only last 1000 measurements to prevent memory growth
    if (this.updateTimes.length > 1000) {
      this.updateTimes.shift();
    }
  }

  /**
   * Record time taken for a query operation.
   * @param duration - Time in milliseconds
   */
  recordQueryTime(duration: number): void {
    this.queryTimes.push(duration);
    // Keep only last 1000 measurements to prevent memory growth
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }
  }

  /**
   * Record an error occurrence for a specific operation.
   * @param operation - Name of the operation that failed
   */
  recordError(operation: string): void {
    const count = this.errorCounts.get(operation) || 0;
    this.errorCounts.set(operation, count + 1);
  }

  /**
   * Get comprehensive performance statistics.
   * @returns Performance metrics including averages and percentiles
   */
  getStats() {
    return {
      updateTimes: {
        count: this.updateTimes.length,
        avg: this.average(this.updateTimes),
        min: Math.min(...this.updateTimes),
        max: Math.max(...this.updateTimes),
        p50: this.percentile(this.updateTimes, 0.5),
        p95: this.percentile(this.updateTimes, 0.95),
        p99: this.percentile(this.updateTimes, 0.99),
      },
      queryTimes: {
        count: this.queryTimes.length,
        avg: this.average(this.queryTimes),
        min: Math.min(...this.queryTimes),
        max: Math.max(...this.queryTimes),
        p50: this.percentile(this.queryTimes, 0.5),
        p95: this.percentile(this.queryTimes, 0.95),
        p99: this.percentile(this.queryTimes, 0.99),
      },
      errors: Object.fromEntries(this.errorCounts),
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Reset all metrics (useful for testing or periodic cleanup).
   */
  reset(): void {
    this.updateTimes = [];
    this.queryTimes = [];
    this.errorCounts.clear();
  }

  /**
   * Get health status based on current metrics.
   * @returns Health assessment with recommendations
   */
  getHealthStatus() {
    const stats = this.getStats();

    const health = {
      status: "healthy" as "healthy" | "warning" | "critical",
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check update performance
    if (stats.updateTimes.p95 > 100) {
      health.status = "warning";
      health.issues.push("95th percentile update time exceeds 100ms");
      health.recommendations.push("Consider optimizing database queries or adding indexes");
    }

    if (stats.updateTimes.p95 > 500) {
      health.status = "critical";
      health.issues.push("95th percentile update time exceeds 500ms");
      health.recommendations.push("Immediate performance optimization required");
    }

    // Check query performance
    if (stats.queryTimes.p95 > 200) {
      health.status = health.status === "critical" ? "critical" : "warning";
      health.issues.push("95th percentile query time exceeds 200ms");
      health.recommendations.push("Consider implementing caching or query optimization");
    }

    // Check error rates
    const errorRate = stats.totalErrors / (stats.updateTimes.count + stats.queryTimes.count);
    if (errorRate > 0.01) {
      // More than 1% error rate
      health.status = health.status === "critical" ? "critical" : "warning";
      health.issues.push(`Error rate is ${(errorRate * 100).toFixed(2)}%`);
      health.recommendations.push("Investigate and fix recurring errors");
    }

    return health;
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
}

export const hierarchicalELOMetrics = new HierarchicalELOMetrics();

/**
 * Decorator for timing function execution.
 * Automatically records execution time in the appropriate metrics category.
 */
export function timed(_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const start = performance.now();
    try {
      const result = await method.apply(this, args);
      const duration = performance.now() - start;

      if (propertyName.includes("update") || propertyName.includes("Update")) {
        hierarchicalELOMetrics.recordUpdateTime(duration);
      } else if (
        propertyName.includes("get") ||
        propertyName.includes("query") ||
        propertyName.includes("Get")
      ) {
        hierarchicalELOMetrics.recordQueryTime(duration);
      }

      return result;
    } catch (error) {
      hierarchicalELOMetrics.recordError(propertyName);
      throw error;
    }
  };

  return descriptor;
}

/**
 * Manual timing utility for functions that can't use decorators.
 * @param operation - Name of the operation being timed
 * @param fn - Function to execute and time
 * @returns Result of the function execution
 */
export async function timeOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (operation.includes("update") || operation.includes("Update")) {
      hierarchicalELOMetrics.recordUpdateTime(duration);
    } else {
      hierarchicalELOMetrics.recordQueryTime(duration);
    }

    return result;
  } catch (error) {
    hierarchicalELOMetrics.recordError(operation);
    throw error;
  }
}
