/**
 * Performance Monitoring Service
 *
 * Tracks API performance metrics and analysis times
 */

interface PerformanceMetric {
  endpoint: string;
  duration: number;
  timestamp: number;
  cached: boolean;
  chain?: string;
  success: boolean;
}

interface PerformanceStats {
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  cacheHitRate: number;
  successRate: number;
  totalRequests: number;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindowMs?: number): PerformanceStats {
    const cutoff = timeWindowMs ? Date.now() - timeWindowMs : 0;
    const recentMetrics = this.metrics.filter((m) => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        cacheHitRate: 0,
        successRate: 0,
        totalRequests: 0,
      };
    }

    // Calculate durations
    const durations = recentMetrics
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const avgDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p50Duration = this.percentile(durations, 50);
    const p95Duration = this.percentile(durations, 95);
    const p99Duration = this.percentile(durations, 99);

    // Calculate cache hit rate
    const cachedRequests = recentMetrics.filter((m) => m.cached).length;
    const cacheHitRate = (cachedRequests / recentMetrics.length) * 100;

    // Calculate success rate
    const successfulRequests = recentMetrics.filter((m) => m.success).length;
    const successRate = (successfulRequests / recentMetrics.length) * 100;

    return {
      avgDuration: Math.round(avgDuration),
      p50Duration: Math.round(p50Duration),
      p95Duration: Math.round(p95Duration),
      p99Duration: Math.round(p99Duration),
      cacheHitRate: Math.round(cacheHitRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      totalRequests: recentMetrics.length,
    };
  }

  /**
   * Get stats by chain
   */
  getStatsByChain(chain: string, timeWindowMs?: number): PerformanceStats {
    const cutoff = timeWindowMs ? Date.now() - timeWindowMs : 0;
    const chainMetrics = this.metrics.filter(
      (m) => m.chain === chain && m.timestamp > cutoff
    );

    if (chainMetrics.length === 0) {
      return {
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        cacheHitRate: 0,
        successRate: 0,
        totalRequests: 0,
      };
    }

    const durations = chainMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const avgDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;

    const cachedRequests = chainMetrics.filter((m) => m.cached).length;
    const cacheHitRate = (cachedRequests / chainMetrics.length) * 100;

    const successfulRequests = chainMetrics.filter((m) => m.success).length;
    const successRate = (successfulRequests / chainMetrics.length) * 100;

    return {
      avgDuration: Math.round(avgDuration),
      p50Duration: Math.round(this.percentile(durations, 50)),
      p95Duration: Math.round(this.percentile(durations, 95)),
      p99Duration: Math.round(this.percentile(durations, 99)),
      cacheHitRate: Math.round(cacheHitRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      totalRequests: chainMetrics.length,
    };
  }

  /**
   * Check if performance targets are met
   */
  checkTargets(): {
    p95UnderTarget: boolean; // < 30s
    cacheHitRateTarget: boolean; // > 70%
    successRateTarget: boolean; // > 95%
    allTargetsMet: boolean;
  } {
    const stats = this.getStats(3600000); // Last hour

    const p95UnderTarget = stats.p95Duration < 30000; // 30s
    const cacheHitRateTarget = stats.cacheHitRate > 70;
    const successRateTarget = stats.successRate > 95;

    return {
      p95UnderTarget,
      cacheHitRateTarget,
      successRateTarget,
      allTargetsMet: p95UnderTarget && cacheHitRateTarget && successRateTarget,
    };
  }

  /**
   * Get slow requests (> threshold)
   */
  getSlowRequests(thresholdMs: number = 10000): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.duration > thresholdMs && !m.cached)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    current: PerformanceStats;
    byChain: Record<string, PerformanceStats>;
    slowRequests: PerformanceMetric[];
    targets: {
      p95UnderTarget: boolean;
      cacheHitRateTarget: boolean;
      successRateTarget: boolean;
      allTargetsMet: boolean;
    };
  } {
    const chains = ["ethereum", "bsc", "polygon", "arbitrum"];
    const byChain: Record<string, PerformanceStats> = {};

    chains.forEach((chain) => {
      byChain[chain] = this.getStatsByChain(chain, 3600000); // Last hour
    });

    return {
      current: this.getStats(3600000),
      byChain,
      slowRequests: this.getSlowRequests(10000),
      targets: this.checkTargets(),
    };
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();
