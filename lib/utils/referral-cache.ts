/**
 * Referral Cache Management
 *
 * Utilities for managing Redis cache for referral stats
 */

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * Clear referral stats cache for a user
 */
export async function clearReferralStatsCache(userId: number): Promise<void> {
  try {
    const cacheKey = `referral:stats:${userId}`;
    await redis.del(cacheKey);
    console.log(`✅ Cleared referral stats cache for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to clear referral stats cache for user ${userId}:`, error);
  }
}

/**
 * Clear referral stats cache for both referrer and referred user
 */
export async function clearReferralCacheForBoth(
  referrerId: number,
  referredId: number
): Promise<void> {
  await Promise.all([
    clearReferralStatsCache(referrerId),
    clearReferralStatsCache(referredId),
  ]);
}

/**
 * Clear referral stats cache for multiple users
 */
export async function clearReferralStatsCacheMulti(
  userIds: number[]
): Promise<void> {
  await Promise.all(userIds.map((id) => clearReferralStatsCache(id)));
}
