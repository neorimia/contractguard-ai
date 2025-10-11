// app/api/referrals/leaderboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralGamificationService } from "@/lib/services/referral-gamification.service";

const gamificationService = new ReferralGamificationService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get leaderboard data
    const leaderboard = await gamificationService.getLeaderboard(
      Math.min(limit, 100)
    );

    return NextResponse.json({
      success: true,
      data: leaderboard,
      meta: {
        total: leaderboard.length,
        limit,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
