// lib/services/banner.service.ts

import { db } from "@/db";
import { banners, bannerImpressions, users, Banner } from "@/db/schema";
import { eq, and, gte, lte, or, isNull, desc, sql } from "drizzle-orm";
import { redis } from "@/lib/redis";

export interface BannerContext {
  placement: string;
  sessionId: string;
  userId?: number;
  scanCount?: number;
  contractAddress?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
}

export class BannerService {
  private static CACHE_PREFIX = "banner:";
  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Select optimal banner for given context
   * Priority: User targeting > Scan count > Priority score > A/B test variant
   */
  static async selectBanner(context: BannerContext): Promise<Banner | null> {
    const { placement, userId, scanCount = 0, sessionId } = context;

    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${sessionId}:${placement}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      try {
        // Upstash Redis returns the value directly, might already be parsed
        if (typeof cached === "string") {
          return JSON.parse(cached) as Banner;
        }
        return cached as Banner;
      } catch (error) {
        console.error("Failed to parse cached banner:", error);
      }
    }

    // Determine user type and tier
    let userType: string = "anonymous";
    let userTier: string = "free";

    if (userId) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length > 0) {
        userType = user[0].accountType || "full";
        userTier = user[0].tier || "free";

        // Determine power user based on scan count
        if (scanCount >= 10 && userTier === "free") {
          userType = "power_user";
        }
      }
    }

    // Fetch eligible banners
    const now = new Date();
    const eligibleBanners = await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          eq(banners.placement, placement as any),
          or(
            eq(banners.targetUserType, userType as any),
            eq(banners.targetUserType, "all")
          ),
          or(eq(banners.targetTier, userTier as any), eq(banners.targetTier, "all")),
          or(isNull(banners.minScans), lte(banners.minScans, scanCount)),
          or(isNull(banners.maxScans), gte(banners.maxScans, scanCount)),
          or(isNull(banners.startDate), lte(banners.startDate, now)),
          or(isNull(banners.endDate), gte(banners.endDate, now))
        )
      )
      .orderBy(desc(banners.priority));

    if (eligibleBanners.length === 0) {
      return null;
    }

    // Check frequency caps
    const eligibleWithCaps = await this.filterByFrequencyCap(
      eligibleBanners,
      sessionId,
      userId
    );

    if (eligibleWithCaps.length === 0) {
      return null;
    }

    // Select banner (weighted random by priority)
    const selectedBanner = this.weightedRandomSelection(eligibleWithCaps);

    // Cache the selection
    await redis.setex(
      cacheKey,
      this.CACHE_TTL,
      JSON.stringify(selectedBanner)
    );

    return selectedBanner;
  }

  /**
   * Filter banners by frequency cap (max impressions per user per day)
   */
  private static async filterByFrequencyCap(
    bannerList: Banner[],
    sessionId: string,
    userId?: number
  ): Promise<Banner[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const eligible: Banner[] = [];

    for (const banner of bannerList) {
      const frequencyCap = banner.metadata?.frequencyCap;

      if (!frequencyCap) {
        eligible.push(banner);
        continue;
      }

      // Count impressions in last 24 hours
      const impressionCount = await db
        .select()
        .from(bannerImpressions)
        .where(
          and(
            eq(bannerImpressions.bannerId, banner.id),
            or(
              eq(bannerImpressions.sessionId, sessionId),
              userId ? eq(bannerImpressions.userId, userId) : sql`false`
            ),
            gte(bannerImpressions.createdAt, oneDayAgo)
          )
        );

      if (impressionCount.length < frequencyCap) {
        eligible.push(banner);
      }
    }

    return eligible;
  }

  /**
   * Weighted random selection based on priority
   */
  private static weightedRandomSelection(bannerList: Banner[]): Banner {
    const totalWeight = bannerList.reduce((sum, b) => sum + b.priority, 0);
    let random = Math.random() * totalWeight;

    for (const banner of bannerList) {
      random -= banner.priority;
      if (random <= 0) {
        return banner;
      }
    }

    return bannerList[0]; // Fallback
  }

  /**
   * Track banner impression
   */
  static async trackImpression(data: {
    bannerId: string;
    sessionId: string;
    userId?: number;
    placement: string;
    scanCount?: number;
    contractAddress?: string;
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    userTier?: string;
  }) {
    try {
      // Insert impression record
      await db.insert(bannerImpressions).values({
        bannerId: data.bannerId,
        sessionId: data.sessionId,
        userId: data.userId,
        placement: data.placement,
        scanCount: data.scanCount,
        contractAddress: data.contractAddress,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        deviceType: data.deviceType as "desktop" | "mobile" | "tablet",
        userTier: data.userTier,
      });

      // Increment banner impression count
      await db
        .update(banners)
        .set({ impressions: sql`${banners.impressions} + 1` })
        .where(eq(banners.id, data.bannerId));

      return { success: true };
    } catch (error) {
      console.error("Failed to track banner impression:", error);
      throw error;
    }
  }

  /**
   * Track banner click
   */
  static async trackClick(data: {
    bannerId: string;
    sessionId: string;
    userId?: number;
  }) {
    try {
      // Find most recent impression
      const impression = await db
        .select()
        .from(bannerImpressions)
        .where(
          and(
            eq(bannerImpressions.bannerId, data.bannerId),
            eq(bannerImpressions.sessionId, data.sessionId),
            eq(bannerImpressions.wasClicked, false)
          )
        )
        .orderBy(desc(bannerImpressions.createdAt))
        .limit(1);

      if (impression.length > 0) {
        await db
          .update(bannerImpressions)
          .set({
            wasClicked: true,
            clickedAt: new Date(),
          })
          .where(eq(bannerImpressions.id, impression[0].id));
      }

      // Increment banner click count
      await db
        .update(banners)
        .set({ clicks: sql`${banners.clicks} + 1` })
        .where(eq(banners.id, data.bannerId));

      return { success: true };
    } catch (error) {
      console.error("Failed to track banner click:", error);
      throw error;
    }
  }

  /**
   * Track conversion (user upgraded after clicking banner)
   * Call this after successful purchase/upgrade
   */
  static async trackConversion(data: {
    sessionId: string;
    userId: number;
    revenueGenerated?: number;
  }) {
    try {
      // Find recent banner clicks in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentClicks = await db
        .select()
        .from(bannerImpressions)
        .where(
          and(
            eq(bannerImpressions.sessionId, data.sessionId),
            eq(bannerImpressions.wasClicked, true),
            eq(bannerImpressions.converted, false),
            gte(bannerImpressions.clickedAt!, sevenDaysAgo)
          )
        )
        .orderBy(desc(bannerImpressions.clickedAt));

      // Attribute conversion to most recent click
      if (recentClicks.length > 0) {
        const attribution = recentClicks[0];

        await db
          .update(bannerImpressions)
          .set({
            converted: true,
            convertedAt: new Date(),
            revenueGenerated: data.revenueGenerated || 0,
          })
          .where(eq(bannerImpressions.id, attribution.id));

        // Increment banner conversion count
        await db
          .update(banners)
          .set({
            conversions: sql`${banners.conversions} + 1`,
            revenue: sql`${banners.revenue} + ${data.revenueGenerated || 0}`,
          })
          .where(eq(banners.id, attribution.bannerId));

        return { success: true, attributed: true };
      }

      return { success: true, attributed: false };
    } catch (error) {
      console.error("Failed to track banner conversion:", error);
      throw error;
    }
  }

  /**
   * Invalidate banner cache
   */
  static async invalidateCache(bannerId?: string) {
    try {
      if (bannerId) {
        // Invalidate specific banner
        const pattern = `${this.CACHE_PREFIX}*`;
        const keys = await redis.keys(pattern);
        const keysToDelete = keys.filter((key: string) =>
          key.includes(bannerId)
        );
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      } else {
        // Invalidate all banners
        const pattern = `${this.CACHE_PREFIX}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.error("Failed to invalidate banner cache:", error);
    }
  }
}
