// app/api/referrals/social-proof/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, referrals, cryptoAudits } from "@/db/schema";
import { count, sql, desc, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get total users
    const [usersResult] = await db.select({ count: count() }).from(users);

    // Get total referrals
    const [referralsResult] = await db
      .select({ count: count() })
      .from(referrals)
      .where(sql`${referrals.status} IN ('confirmed', 'rewarded')`);

    // Get total scans (crypto audits)
    const [scansResult] = await db
      .select({ count: count() })
      .from(cryptoAudits);

    // Calculate estimated savings (assume $5000 per scam avoided)
    // Get high-risk audits (risk score > 70)
    const [highRiskResult] = await db
      .select({ count: count() })
      .from(cryptoAudits)
      .where(gte(cryptoAudits.riskScore, 70));

    const scamsAvoided = highRiskResult?.count || 0;
    const estimatedSavings = scamsAvoided * 5000; // $5000 per scam

    // Get top referrer stats
    const [topReferrer] = await db
      .select({
        referralCount: users.referralCount,
        displayName: users.displayName,
        email: users.email,
      })
      .from(users)
      .where(gte(users.referralCount, 1))
      .orderBy(desc(users.referralCount))
      .limit(1);

    // Get recent milestone users (joined in last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [recentUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, yesterday));

    // Calculate viral coefficient (simple version)
    const totalUsers = usersResult?.count || 0;
    const totalReferrals = referralsResult?.count || 0;
    const viralCoefficient = totalUsers > 0 ? totalReferrals / totalUsers : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsersJoined: totalUsers,
        totalScamsAvoided: scamsAvoided,
        estimatedSavings: estimatedSavings,
        estimatedSavingsFormatted: `$${(estimatedSavings / 100).toLocaleString()}`,
        totalReferrals: totalReferrals,
        totalScans: scansResult?.count || 0,
        topReferrerCount: topReferrer?.referralCount || 0,
        topReferrerName:
          topReferrer?.displayName ||
          topReferrer?.email?.split("@")[0] ||
          "Anonymous",
        recentUsers24h: recentUsersResult?.count || 0,
        viralCoefficient: viralCoefficient.toFixed(2),
        milestones: {
          nextUserMilestone: getNextMilestone(
            totalUsers,
            [100, 500, 1000, 5000, 10000, 50000]
          ),
          nextSavingsMilestone: getNextMilestone(
            estimatedSavings,
            [10000, 50000, 100000, 500000, 1000000]
          ),
        },
      },
      meta: {
        updatedAt: new Date().toISOString(),
        cacheTTL: 300, // 5 minutes
      },
    });
  } catch (error) {
    console.error("Social proof API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch social proof stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getNextMilestone(
  current: number,
  milestones: number[]
): number | null {
  for (const milestone of milestones) {
    if (current < milestone) {
      return milestone;
    }
  }
  return null;
}
