// app/api/cron/check-watchlists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { WatchlistMonitorService } from "@/lib/services/watchlist-monitor.service";

// Protect cron endpoint with secret
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/check-watchlists
 * Cron job to check all watchlists for changes
 * Called every 5 minutes by Vercel Cron or external scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error("[CRON] Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    console.log("[CRON] Starting watchlist check...");

    const monitor = new WatchlistMonitorService();
    const result = await monitor.checkAllWatchlists();

    console.log(
      `[CRON] Watchlist check completed. Checked: ${result.checked}, Alerts sent: ${result.alertsSent}`
    );

    return NextResponse.json({
      status: "success",
      message: "Watchlist check completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error checking watchlists:", error);
    return NextResponse.json(
      {
        error: "Watchlist check failed",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}
