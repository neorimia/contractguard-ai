// app/api/referrals/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { ReferralGamificationService } from "@/lib/services/referral-gamification.service";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const gamificationService = new ReferralGamificationService();

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.stackUserId, stackUser.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get dashboard data
    const dashboard = await gamificationService.getUserDashboard(dbUser.id);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
