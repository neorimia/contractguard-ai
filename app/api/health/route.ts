/**
 * Health Check Endpoint
 *
 * Monitors system health and external service availability
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { redis } from "@/lib/redis";
import { sql } from "drizzle-orm";
import { performanceMonitoring } from "@/lib/services/monitoring/performance.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {};

  // Check database
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "healthy", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: "healthy", latency: Date.now() - redisStart };
  } catch (error) {
    checks.redis = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check external APIs
  const apiChecks = await checkExternalAPIs();
  checks.externalAPIs = apiChecks;

  // Get performance metrics
  const perfMetrics = performanceMonitoring.exportMetrics();
  checks.performance = {
    current: perfMetrics.current,
    targets: perfMetrics.targets,
    slowRequests: perfMetrics.slowRequests.length,
  };

  // Determine overall health
  const healthy =
    checks.database.status === "healthy" &&
    checks.redis.status === "healthy" &&
    checks.externalAPIs.status === "healthy";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || "1.0.0",
    },
    { status: healthy ? 200 : 503 }
  );
}

/**
 * Check external API availability
 */
async function checkExternalAPIs(): Promise<{
  status: string;
  services: Record<string, any>;
}> {
  const services: Record<string, any> = {};

  // Check Etherscan
  try {
    const response = await fetch(
      "https://api.etherscan.io/api?module=stats&action=ethsupply",
      { signal: AbortSignal.timeout(5000) }
    );
    services.etherscan = {
      status: response.ok ? "healthy" : "degraded",
      statusCode: response.status,
    };
  } catch (error) {
    services.etherscan = { status: "unhealthy" };
  }

  // Check DexScreener
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7",
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    services.dexscreener = {
      status: response.ok ? "healthy" : "degraded",
      statusCode: response.status,
    };
  } catch (error) {
    services.dexscreener = { status: "unhealthy" };
  }

  const allHealthy = Object.values(services).every(
    (s) => s.status === "healthy"
  );

  return {
    status: allHealthy ? "healthy" : "degraded",
    services,
  };
}
