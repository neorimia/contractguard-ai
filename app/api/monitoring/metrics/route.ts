/**
 * Monitoring Metrics API
 *
 * Returns performance and accuracy metrics for monitoring
 */

import { NextRequest, NextResponse } from "next/server";
import { performanceMonitoring } from "@/lib/services/monitoring/performance.service";
import { heuristicAccuracy } from "@/lib/services/monitoring/heuristic-accuracy.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authHeader = request.headers.get("authorization");
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

    // For now, allow access without auth (add proper auth in production)
    // TODO: Implement proper authentication

    // Get performance metrics
    const performanceMetrics = performanceMonitoring.exportMetrics();

    // Get accuracy metrics
    const accuracyMetrics = heuristicAccuracy.exportMetrics();

    // Combine metrics
    const response = {
      timestamp: new Date().toISOString(),
      performance: {
        overall: performanceMetrics.current,
        byChain: performanceMetrics.byChain,
        slowRequests: performanceMetrics.slowRequests.length,
        targets: performanceMetrics.targets,
      },
      accuracy: {
        overall: accuracyMetrics.overall,
        byHeuristic: accuracyMetrics.byHeuristic,
        worstPerformers: accuracyMetrics.worstPerformers,
      },
      health: {
        performanceTargetsMet: performanceMetrics.targets.allTargetsMet,
        accuracyTargetsMet: accuracyMetrics.overall.meetsTargets,
        overall:
          performanceMetrics.targets.allTargetsMet &&
          accuracyMetrics.overall.meetsTargets,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Metrics endpoint error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
