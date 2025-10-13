// app/api/referrals/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/services/referral.service";
import { AuthService } from "@/lib/services/auth.service";
import { stackServerApp } from "@/stack/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache TTL for referral stats (5 minutes)
const CACHE_TTL = 300;

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Stack Auth
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    // Validate that user has an email
    if (!stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Invalid user account - Missing email address" },
        { status: 400 }
      );
    }

    // Get or create app user in our database
    const authService = new AuthService();
    let appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      // First time user - create in our database
      appUser = await authService.syncUser(
        stackUser.id,
        stackUser.primaryEmail,
        {
          displayName: stackUser.displayName || undefined,
          avatarUrl: stackUser.profileImageUrl || undefined,
        }
      );
    }

    // Check Redis cache first
    const cacheKey = `referral:stats:${appUser.id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`Cache hit for referral stats: user ${appUser.id}`);
      return NextResponse.json(cached);
    }

    console.log(`Cache miss for referral stats: user ${appUser.id}`);

    const referralService = new ReferralService();

    // Get or generate referral code
    const referralCode = await referralService.generateReferralCodeForUser(
      appUser.id
    );

    // Get referral stats
    const stats = await referralService.getReferralStats(appUser.id);

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
        rewardAmount: r.rewardAmount,
      })),
    };

    // Cache the response
    await redis.set(cacheKey, response, { ex: CACHE_TTL });
    console.log(
      `Cached referral stats for user ${appUser.id} (TTL: ${CACHE_TTL}s)`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting referral stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
