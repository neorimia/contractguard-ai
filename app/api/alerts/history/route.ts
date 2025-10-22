// app/api/alerts/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alertHistory, watchlists } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";

/**
 * GET /api/alerts/history
 * Get alert history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const authService = new AuthService();
    const user = await authService.getUserByStackId(stackUser.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get alert history with watchlist info
    const alerts = await db
      .select({
        alert: alertHistory,
        watchlist: watchlists,
      })
      .from(alertHistory)
      .leftJoin(watchlists, eq(alertHistory.watchlistId, watchlists.id))
      .where(eq(alertHistory.userId, user.id))
      .orderBy(desc(alertHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: alerts,
      status: "success",
    });
  } catch (error) {
    console.error("[API] Error fetching alert history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch alert history",
        details: error instanceof Error ? error.message : undefined,
        status: "error",
      },
      { status: 500 }
    );
  }
}
