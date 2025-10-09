// app/api/referrals/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";
import { getUserFromRequest } from "@/lib/middleware/auth.middleware";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache TTL for referral stats (5 minutes)
const CACHE_TTL = 300;

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = getUserFromRequest(request);

    // Check Redis cache first
    const cacheKey = `referral:stats:${user.id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`Cache hit for referral stats: user ${user.id}`);
      return NextResponse.json(cached);
    }

    console.log(`Cache miss for referral stats: user ${user.id}`);

    const referralService = new ReferralService();

    // Get or generate referral code
    let referralCode = user.email; // Placeholder, will be replaced

    // We need to get user's referral code from database
    // For now, generate if not exists
    referralCode = await referralService.generateReferralCodeForUser(user.id);

    // Get referral stats
    const stats = await referralService.getReferralStats(user.id);

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL}/ref/${referralCode}`;

    const response = {
      referralCode,
      referralLink,
      stats: {
        totalInvites: stats.totalInvites,
        confirmed: stats.confirmedInvites,
        pending: stats.pendingInvites,
        scansEarned: stats.totalEarned.scans,
        earned: stats.totalEarned,
      },
      recentReferrals: stats.recentReferrals.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        confirmedAt: r.confirmedAt,
      })),
    };

    // Cache the response
    await redis.set(cacheKey, response, { ex: CACHE_TTL });
    console.log(`Cached referral stats for user ${user.id} (TTL: ${CACHE_TTL}s)`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting referral stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}