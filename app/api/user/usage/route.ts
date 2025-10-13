/**
 * GET /api/user/usage
 *
 * Fetch usage statistics for authenticated user
 * Including current scans, historical data, and tier limits
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { AuthService } from "@/lib/services/auth.service";
import { db } from "@/db";
import { cryptoAudits } from "@/db/schema";
import { sql, gte } from "drizzle-orm";

const authService = new AuthService();

// Tier-based daily limits
const TIER_LIMITS = {
  free: 3,
  pro: 100,
  enterprise: 999999,
} as const;

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await authService.getUserByStackUserId(user.id);
    if (!dbUser) {
      return NextResponse.json(
        { status: "error", error: "User not found" },
        { status: 404 }
      );
    }

    // Get tier limit
    const limit =
      TIER_LIMITS[dbUser.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

    // Calculate historical usage from audit logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query daily scan counts (simplified for MVP)
    // Note: This queries all crypto audits - in production, you'd want to track per-user scans
    const historicalScans = await db
      .select({
        date: sql<string>`DATE(${cryptoAudits.createdAt})`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(cryptoAudits)
      .where(gte(cryptoAudits.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${cryptoAudits.createdAt})`)
      .orderBy(sql`DATE(${cryptoAudits.createdAt}) DESC`)
      .limit(30);

    // Calculate this month's total
    const scansThisMonth = historicalScans.reduce(
      (sum, day) => sum + (day.count || 0),
      0
    );

    // Calculate last month (days 31-60)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const lastMonthScans = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(cryptoAudits)
      .where(gte(cryptoAudits.createdAt, sixtyDaysAgo))
      .limit(1);

    const response = {
      current: {
        scansToday: dbUser.scansToday || 0,
        scansThisMonth,
        limit,
        resetAt: dbUser.scansResetAt?.toISOString() || new Date().toISOString(),
      },
      instantCredits: {
        balance: dbUser.instantCredits || 0,
        usedToday: dbUser.instantCreditsUsedToday || 0,
      },
      historical: {
        daily: historicalScans.map((day) => ({
          date: day.date,
          scans: day.count || 0,
        })),
        monthly: [
          {
            month: "last_month",
            scans: lastMonthScans[0]?.count || 0,
          },
        ],
      },
      tier: dbUser.tier,
      accessSummary: {
        type:
          dbUser.tier === "pro" || dbUser.tier === "enterprise"
            ? "subscription"
            : (dbUser.instantCredits || 0) > 0
              ? "instant_credits"
              : "free",
        description:
          dbUser.tier === "pro"
            ? "Pro Plan - Unlimited scans"
            : dbUser.tier === "enterprise"
              ? "Enterprise Plan - Unlimited scans"
              : (dbUser.instantCredits || 0) > 0
                ? `${dbUser.instantCredits} instant ${dbUser.instantCredits === 1 ? "report" : "reports"} available`
                : `${limit - (dbUser.scansToday || 0)} free scans remaining today`,
      },
    };

    return NextResponse.json({
      status: "success",
      data: response,
    });
  } catch (error: any) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch usage data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
