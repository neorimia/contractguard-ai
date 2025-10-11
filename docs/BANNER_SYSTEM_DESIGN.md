# ContractGuard AI Banner Monetization System - Technical Design

## Executive Summary

Comprehensive design specification for implementing a dual-revenue banner system targeting **€3-20K/month** at 100K free users through:
1. **Internal upgrade banners** (€10-15K/month from conversion lift)
2. **External crypto ad banners** (€3-5K/month from Cointraffic/Coinzilla)

**Target Metrics**: 0.3-0.8% CTR, 3-4% conversion rate, ≥80% cache hit rate, <500ms load time

---

## 1. Database Schema Design

### 1.1 Core Tables

```typescript
// db/schema.ts additions

export const banners = pgTable("banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Banner Identity
  name: text("name").notNull(), // "upgrade_power_user", "comparison_chart"
  type: text("type", {
    enum: ["internal_upgrade", "partner_ad", "feature_education", "social_proof", "urgency"]
  }).notNull(),
  category: text("category", {
    enum: ["upgrade", "educational", "winback", "paywall", "partnership"]
  }).notNull(),

  // Placement Configuration
  placement: text("placement", {
    enum: ["top_leaderboard", "sidebar_rectangle", "bottom_sticky", "inline_result", "modal_overlay"]
  }).notNull(),
  priority: integer("priority").notNull().default(5), // 1-10, higher = more priority

  // Targeting Rules
  targetUserType: text("target_user_type", {
    enum: ["anonymous", "soft", "free", "power_user", "churned", "all"]
  }).notNull(),
  minScans: integer("min_scans").default(0), // Minimum scans performed
  maxScans: integer("max_scans"), // Maximum scans (null = unlimited)
  targetTier: text("target_tier", {
    enum: ["free", "pro", "enterprise", "all"]
  }).default("all"),

  // Content
  headline: text("headline").notNull(), // "You've scanned 47 contracts"
  body: text("body"), // "Upgrade to Pro for unlimited"
  ctaText: text("cta_text").notNull(), // "Try Pro - €29/mo"
  ctaUrl: text("cta_url").notNull(), // "/pricing" or external URL

  // Design Specifications
  format: text("format", {
    enum: ["static", "animated", "html5", "video"]
  }).notNull().default("static"),
  backgroundColor: text("background_color").default("#1F2937"),
  textColor: text("text_color").default("#FFFFFF"),
  assetUrl: text("asset_url"), // URL to banner image/video
  customCss: text("custom_css"), // Optional custom styling

  // A/B Testing
  variantGroup: text("variant_group"), // "upgrade_cta_test_1"
  variantName: text("variant_name"), // "variant_a", "variant_b"

  // External Partner Configuration
  isExternal: boolean("is_external").default(false),
  partnerName: text("partner_name"), // "Cointraffic", "Coinzilla"
  partnerScriptUrl: text("partner_script_url"),
  partnerAdUnitId: text("partner_ad_unit_id"),
  cpmRate: integer("cpm_rate"), // In cents ($2.50 = 250)

  // Status & Scheduling
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  // Performance Tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: integer("revenue").default(0), // In cents

  // Metadata
  metadata: jsonb("metadata").$type<{
    frequencyCap?: number; // Max impressions per user per day
    showAfterScan?: number; // Show after Nth scan
    dismissible?: boolean;
    requiresConsent?: boolean; // GDPR compliance
    notes?: string;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const bannerImpressions = pgTable("banner_impressions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  bannerId: text("banner_id")
    .notNull()
    .references(() => banners.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id").notNull(), // Anonymous or authenticated session

  // Context
  contractAddress: text("contract_address"), // Contract being viewed when shown
  scanCount: integer("scan_count"), // User's total scans at impression time
  userTier: text("user_tier"), // User tier at impression time
  placement: text("placement").notNull(),

  // Interaction
  wasClicked: boolean("was_clicked").default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  converted: boolean("converted").default(false),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  revenueGenerated: integer("revenue_generated").default(0), // In cents

  // Technical Metadata
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  deviceType: text("device_type", {
    enum: ["desktop", "mobile", "tablet"]
  }),

  // A/B Testing Context
  variantGroup: text("variant_group"),
  variantName: text("variant_name"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bannerAnalytics = pgTable("banner_analytics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Aggregation Period
  bannerId: text("banner_id")
    .notNull()
    .references(() => banners.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  period: text("period", {
    enum: ["hourly", "daily", "weekly", "monthly"]
  }).notNull(),

  // Core Metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  ctr: integer("ctr").default(0), // Click-through rate × 10000 (0.35% = 35)
  conversionRate: integer("conversion_rate").default(0), // × 10000
  revenue: integer("revenue").default(0), // In cents
  revenuePerImpression: integer("revenue_per_impression").default(0), // In cents × 1000

  // Segmentation
  userType: text("user_type"), // anonymous, soft, free, pro
  placement: text("placement"),
  deviceType: text("device_type"),

  // Quality Metrics
  averageTimeToClick: integer("average_time_to_click"), // Milliseconds
  bounceRate: integer("bounce_rate"), // × 100

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Type exports
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
export type BannerImpression = typeof bannerImpressions.$inferSelect;
export type NewBannerImpression = typeof bannerImpressions.$inferInsert;
export type BannerAnalytics = typeof bannerAnalytics.$inferSelect;
export type NewBannerAnalytics = typeof bannerAnalytics.$inferInsert;
```

### 1.2 Schema Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_banners_active ON banners(is_active, target_user_type, placement);
CREATE INDEX idx_banners_priority ON banners(priority DESC) WHERE is_active = true;
CREATE INDEX idx_banner_impressions_session ON banner_impressions(session_id, created_at DESC);
CREATE INDEX idx_banner_impressions_user ON banner_impressions(user_id, created_at DESC);
CREATE INDEX idx_banner_analytics_date ON banner_analytics(date DESC, period);
CREATE INDEX idx_banner_analytics_performance ON banner_analytics(bannerId, date DESC, ctr DESC);
```

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
components/banners/
├── BannerManager.tsx          # Main orchestrator
├── BannerSlot.tsx            # Placement wrapper
├── BannerRenderer.tsx        # Content renderer
├── BannerTracking.tsx        # Analytics wrapper
├── types/
│   └── banner.types.ts       # Shared TypeScript types
├── templates/
│   ├── LeaderboardBanner.tsx      # 728×90 / 320×50
│   ├── RectangleBanner.tsx        # 300×250
│   ├── StickyBanner.tsx           # Mobile bottom sticky
│   ├── InlineResultBanner.tsx     # Between scan results
│   └── ModalOverlayBanner.tsx     # Full-screen takeover
└── variants/
    ├── UpgradeBanner.tsx          # Internal upgrade CTAs
    ├── ComparisonBanner.tsx       # Free vs Pro
    ├── SocialProofBanner.tsx      # Stats & testimonials
    ├── UrgencyBanner.tsx          # Countdown timers
    └── PartnerAdBanner.tsx        # External ad network
```

### 2.2 Core Component Implementations

#### BannerManager.tsx
```typescript
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { BannerSlot } from "./BannerSlot";
import { Banner, BannerPlacement } from "./types/banner.types";

interface BannerManagerProps {
  placement: BannerPlacement;
  scanCount?: number;
  contractAddress?: string;
}

export function BannerManager({ placement, scanCount, contractAddress }: BannerManagerProps) {
  const user = useUser();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get or create session ID
    const existingSessionId = localStorage.getItem("banner_session_id");
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("banner_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Fetch banner for this placement and user context
    const fetchBanner = async () => {
      try {
        const response = await fetch("/api/banners/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            placement,
            scanCount,
            contractAddress,
            sessionId,
            userId: user?.id,
          }),
        });

        const data = await response.json();

        if (data.banner) {
          setBanner(data.banner);
        }
      } catch (error) {
        console.error("Failed to fetch banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [placement, scanCount, sessionId, user?.id, contractAddress]);

  if (loading || !banner) return null;

  return (
    <BannerSlot
      banner={banner}
      sessionId={sessionId}
      userId={user?.id}
      placement={placement}
      scanCount={scanCount}
      contractAddress={contractAddress}
    />
  );
}
```

#### BannerSlot.tsx
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { BannerRenderer } from "./BannerRenderer";
import { BannerTracking } from "./BannerTracking";
import { Banner, BannerPlacement } from "./types/banner.types";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";

interface BannerSlotProps {
  banner: Banner;
  sessionId: string;
  userId?: number;
  placement: BannerPlacement;
  scanCount?: number;
  contractAddress?: string;
}

export function BannerSlot({
  banner,
  sessionId,
  userId,
  placement,
  scanCount,
  contractAddress,
}: BannerSlotProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const impressionTracked = useRef(false);
  const visibilityTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if banner was recently dismissed
    const dismissedKey = `banner_dismissed_${banner.id}`;
    const dismissedAt = localStorage.getItem(dismissedKey);

    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      const hoursSinceDismiss = (now - dismissedTime) / (1000 * 60 * 60);

      // Respect 24-hour dismissal period
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    // Implement viewability: banner must be 50% visible for 1 second
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visibilityTimerRef.current = setTimeout(() => {
              setVisible(true);
            }, 1000);
          } else {
            if (visibilityTimerRef.current) {
              clearTimeout(visibilityTimerRef.current);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`banner-${banner.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [banner.id]);

  useEffect(() => {
    // Track impression once visible
    if (visible && !impressionTracked.current) {
      impressionTracked.current = true;

      // Track impression in database
      fetch("/api/banners/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerId: banner.id,
          sessionId,
          userId,
          placement,
          scanCount,
          contractAddress,
          userAgent: navigator.userAgent,
          deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
        }),
      });

      // Track in PostHog
      trackEvent(AnalyticsEvents.BANNER_IMPRESSION, {
        bannerId: banner.id,
        bannerName: banner.name,
        placement,
        type: banner.type,
        category: banner.category,
      });
    }
  }, [visible, banner, sessionId, userId, placement, scanCount, contractAddress]);

  const handleClick = async () => {
    // Track click
    await fetch("/api/banners/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bannerId: banner.id,
        sessionId,
        userId,
      }),
    });

    trackEvent(AnalyticsEvents.BANNER_CLICK, {
      bannerId: banner.id,
      bannerName: banner.name,
      placement,
      ctaUrl: banner.ctaUrl,
    });

    // Navigate to CTA URL
    if (banner.ctaUrl.startsWith("http")) {
      window.open(banner.ctaUrl, "_blank");
    } else {
      window.location.href = banner.ctaUrl;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`banner_dismissed_${banner.id}`, new Date().toISOString());

    trackEvent(AnalyticsEvents.BANNER_DISMISSED, {
      bannerId: banner.id,
      bannerName: banner.name,
      placement,
    });
  };

  if (dismissed) return null;

  return (
    <div id={`banner-${banner.id}`} className="banner-slot">
      <BannerRenderer
        banner={banner}
        onClick={handleClick}
        onDismiss={banner.metadata?.dismissible ? handleDismiss : undefined}
      />
    </div>
  );
}
```

#### BannerRenderer.tsx
```typescript
"use client";

import { Banner } from "./types/banner.types";
import { LeaderboardBanner } from "./templates/LeaderboardBanner";
import { RectangleBanner } from "./templates/RectangleBanner";
import { StickyBanner } from "./templates/StickyBanner";
import { InlineResultBanner } from "./templates/InlineResultBanner";
import { ModalOverlayBanner } from "./templates/ModalOverlayBanner";

interface BannerRendererProps {
  banner: Banner;
  onClick: () => void;
  onDismiss?: () => void;
}

export function BannerRenderer({ banner, onClick, onDismiss }: BannerRendererProps) {
  // External partner ads use iframe embed
  if (banner.isExternal && banner.partnerScriptUrl) {
    return (
      <div className="partner-ad-container">
        <script
          async
          src={banner.partnerScriptUrl}
          data-ad-unit={banner.partnerAdUnitId}
        />
      </div>
    );
  }

  // Internal banner templates
  switch (banner.placement) {
    case "top_leaderboard":
      return (
        <LeaderboardBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "sidebar_rectangle":
      return (
        <RectangleBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "bottom_sticky":
      return (
        <StickyBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "inline_result":
      return (
        <InlineResultBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "modal_overlay":
      return (
        <ModalOverlayBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    default:
      return null;
  }
}
```

### 2.3 Banner Placement Integration

**ScanInterface.tsx Integration:**
```typescript
// After scan results, above scan history
<div className="max-w-6xl mx-auto space-y-8">
  {/* Top Leaderboard - Desktop */}
  <div className="hidden md:block">
    <BannerManager
      placement="top_leaderboard"
      scanCount={userAccessStatus?.scansRemaining ? 3 - userAccessStatus.scansRemaining : anonymousScansPerformed}
      contractAddress={address}
    />
  </div>

  {/* Mobile Leaderboard */}
  <div className="block md:hidden">
    <BannerManager
      placement="top_leaderboard"
      scanCount={userAccessStatus?.scansRemaining ? 3 - userAccessStatus.scansRemaining : anonymousScansPerformed}
      contractAddress={address}
    />
  </div>

  {/* Scan Results */}
  <ScanResults result={result} contractAddress={address} />

  {/* Sidebar Rectangle - Desktop Only */}
  <aside className="hidden lg:block fixed right-8 top-32 w-[300px]">
    <BannerManager
      placement="sidebar_rectangle"
      scanCount={userAccessStatus?.scansRemaining ? 3 - userAccessStatus.scansRemaining : anonymousScansPerformed}
    />
  </aside>

  {/* Bottom Sticky - Mobile Only */}
  <div className="block md:hidden">
    <BannerManager
      placement="bottom_sticky"
      scanCount={userAccessStatus?.scansRemaining ? 3 - userAccessStatus.scansRemaining : anonymousScansPerformed}
    />
  </div>
</div>
```

---

## 3. Banner Selection & Rotation Logic

### 3.1 Banner Selection Service

```typescript
// lib/services/banner.service.ts

import { db } from "@/db";
import { banners, users, anonymousScans } from "@/db/schema";
import { eq, and, gte, lte, or, isNull, desc } from "drizzle-orm";

export interface BannerContext {
  placement: string;
  sessionId: string;
  userId?: number;
  scanCount?: number;
  contractAddress?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
}

export class BannerService {
  /**
   * Select optimal banner for given context
   * Priority: User targeting > Scan count > Priority score > A/B test variant
   */
  static async selectBanner(context: BannerContext) {
    const { placement, userId, scanCount = 0, deviceType = "desktop" } = context;

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
          eq(banners.placement, placement),
          or(
            eq(banners.targetUserType, userType),
            eq(banners.targetUserType, "all")
          ),
          or(
            eq(banners.targetTier, userTier),
            eq(banners.targetTier, "all")
          ),
          or(
            isNull(banners.minScans),
            gte(scanCount, banners.minScans)
          ),
          or(
            isNull(banners.maxScans),
            lte(scanCount, banners.maxScans)
          ),
          or(
            isNull(banners.startDate),
            lte(banners.startDate, now)
          ),
          or(
            isNull(banners.endDate),
            gte(banners.endDate, now)
          )
        )
      )
      .orderBy(desc(banners.priority));

    if (eligibleBanners.length === 0) {
      return null;
    }

    // Check frequency caps
    const eligibleWithCaps = await this.filterByFrequencyCap(
      eligibleBanners,
      context.sessionId,
      userId
    );

    if (eligibleWithCaps.length === 0) {
      return null;
    }

    // Select banner (weighted random by priority)
    const selectedBanner = this.weightedRandomSelection(eligibleWithCaps);

    return selectedBanner;
  }

  /**
   * Filter banners by frequency cap (max impressions per user per day)
   */
  private static async filterByFrequencyCap(
    bannerList: any[],
    sessionId: string,
    userId?: number
  ) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const eligible = [];
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
              userId ? eq(bannerImpressions.userId, userId) : undefined
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
  private static weightedRandomSelection(bannerList: any[]) {
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
  }) {
    const impression = await db.insert(bannerImpressions).values({
      bannerId: data.bannerId,
      sessionId: data.sessionId,
      userId: data.userId,
      placement: data.placement,
      scanCount: data.scanCount,
      contractAddress: data.contractAddress,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      deviceType: data.deviceType,
    });

    // Increment banner impression count
    await db
      .update(banners)
      .set({ impressions: sql`impressions + 1` })
      .where(eq(banners.id, data.bannerId));

    return impression;
  }

  /**
   * Track banner click
   */
  static async trackClick(data: {
    bannerId: string;
    sessionId: string;
    userId?: number;
  }) {
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
      .set({ clicks: sql`clicks + 1` })
      .where(eq(banners.id, data.bannerId));
  }

  /**
   * Track conversion (user upgraded after clicking banner)
   */
  static async trackConversion(data: {
    sessionId: string;
    userId: number;
    revenueGenerated?: number;
  }) {
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
          gte(bannerImpressions.clickedAt, sevenDaysAgo)
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
          conversions: sql`conversions + 1`,
          revenue: sql`revenue + ${data.revenueGenerated || 0}`,
        })
        .where(eq(banners.id, attribution.bannerId));
    }
  }
}
```

### 3.2 Banner Selection API Route

```typescript
// app/api/banners/select/route.ts

import { NextRequest, NextResponse } from "next/server";
import { BannerService } from "@/lib/services/banner.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      placement,
      sessionId,
      userId,
      scanCount,
      contractAddress,
    } = body;

    if (!placement || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const banner = await BannerService.selectBanner({
      placement,
      sessionId,
      userId,
      scanCount,
      contractAddress,
      deviceType: request.headers.get("user-agent")?.includes("Mobile")
        ? "mobile"
        : "desktop",
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner selection error:", error);
    return NextResponse.json(
      { error: "Failed to select banner" },
      { status: 500 }
    );
  }
}
```

---

## 4. Analytics & A/B Testing Framework

### 4.1 PostHog Event Tracking

```typescript
// lib/analytics/posthog.ts additions

export const AnalyticsEvents = {
  // ... existing events

  // Banner Events
  BANNER_IMPRESSION: "banner_impression",
  BANNER_CLICK: "banner_click",
  BANNER_CONVERSION: "banner_conversion",
  BANNER_DISMISSED: "banner_dismissed",
} as const;

// Track banner impression with context
export function trackBannerImpression(properties: {
  bannerId: string;
  bannerName: string;
  placement: string;
  type: string;
  category: string;
  scanCount?: number;
  userTier?: string;
}) {
  trackEvent(AnalyticsEvents.BANNER_IMPRESSION, properties);
}

// Track banner click
export function trackBannerClick(properties: {
  bannerId: string;
  bannerName: string;
  placement: string;
  ctaUrl: string;
  scanCount?: number;
}) {
  trackEvent(AnalyticsEvents.BANNER_CLICK, properties);
}

// Track banner conversion
export function trackBannerConversion(properties: {
  bannerId: string;
  bannerName: string;
  placement: string;
  revenueGenerated: number;
  conversionType: "upgrade" | "purchase";
}) {
  trackEvent(AnalyticsEvents.BANNER_CONVERSION, properties);
}
```

### 4.2 A/B Testing Implementation

```typescript
// lib/services/ab-testing.service.ts

export class ABTestingService {
  /**
   * Assign user to A/B test variant
   * Uses consistent hashing to ensure same user sees same variant
   */
  static assignVariant(sessionId: string, variantGroup: string, variants: string[]): string {
    const hash = this.simpleHash(`${sessionId}:${variantGroup}`);
    const index = hash % variants.length;
    return variants[index];
  }

  /**
   * Simple hash function for consistent variant assignment
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate statistical significance between variants
   * Uses two-proportion z-test
   */
  static calculateSignificance(
    variantA: { impressions: number; conversions: number },
    variantB: { impressions: number; conversions: number }
  ): {
    pValue: number;
    isSignificant: boolean;
    winningVariant: "A" | "B" | "none";
  } {
    const p1 = variantA.conversions / variantA.impressions;
    const p2 = variantB.conversions / variantB.impressions;
    const pPool = (variantA.conversions + variantB.conversions) /
                  (variantA.impressions + variantB.impressions);

    const se = Math.sqrt(
      pPool * (1 - pPool) * (1 / variantA.impressions + 1 / variantB.impressions)
    );

    const z = (p1 - p2) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    const isSignificant = pValue < 0.05;
    let winningVariant: "A" | "B" | "none" = "none";

    if (isSignificant) {
      winningVariant = p1 > p2 ? "A" : "B";
    }

    return { pValue, isSignificant, winningVariant };
  }

  /**
   * Cumulative distribution function for standard normal distribution
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }
}
```

### 4.3 A/B Testing Dashboard

```typescript
// app/api/banners/ab-test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners, bannerImpressions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { ABTestingService } from "@/lib/services/ab-testing.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const variantGroup = searchParams.get("variantGroup");

  if (!variantGroup) {
    return NextResponse.json(
      { error: "Missing variantGroup parameter" },
      { status: 400 }
    );
  }

  // Fetch all variants in this group
  const variants = await db
    .select()
    .from(banners)
    .where(eq(banners.variantGroup, variantGroup));

  if (variants.length < 2) {
    return NextResponse.json(
      { error: "Not enough variants for comparison" },
      { status: 400 }
    );
  }

  // Calculate metrics for each variant
  const results = await Promise.all(
    variants.map(async (variant) => {
      const impressionsData = await db
        .select()
        .from(bannerImpressions)
        .where(eq(bannerImpressions.bannerId, variant.id));

      const clicks = impressionsData.filter((i) => i.wasClicked).length;
      const conversions = impressionsData.filter((i) => i.converted).length;
      const ctr = impressionsData.length > 0
        ? (clicks / impressionsData.length) * 100
        : 0;
      const conversionRate = clicks > 0
        ? (conversions / clicks) * 100
        : 0;

      return {
        variantName: variant.variantName,
        impressions: impressionsData.length,
        clicks,
        conversions,
        ctr: ctr.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
      };
    })
  );

  // Calculate statistical significance (A/B only for now)
  let significance = null;
  if (results.length === 2) {
    significance = ABTestingService.calculateSignificance(
      {
        impressions: results[0].impressions,
        conversions: results[0].conversions,
      },
      {
        impressions: results[1].impressions,
        conversions: results[1].conversions,
      }
    );
  }

  return NextResponse.json({
    variantGroup,
    results,
    significance,
  });
}
```

---

## 5. External Ad Network Integration

### 5.1 Cointraffic Integration

```typescript
// components/banners/variants/CointrafficAd.tsx

"use client";

import { useEffect } from "react";

interface CointrafficAdProps {
  adUnitId: string;
  placement: "leaderboard" | "rectangle" | "skyscraper";
}

export function CointrafficAd({ adUnitId, placement }: CointrafficAdProps) {
  useEffect(() => {
    // Load Cointraffic ad script
    const script = document.createElement("script");
    script.src = "https://cdn.cointraffic.io/js/ct.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const dimensions = {
    leaderboard: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    skyscraper: { width: 160, height: 600 },
  };

  const { width, height } = dimensions[placement];

  return (
    <div
      className="cointraffic-ad-container"
      data-ct-ad-id={adUnitId}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        margin: "0 auto",
      }}
    />
  );
}
```

### 5.2 Revenue Tracking for External Ads

```typescript
// app/api/webhooks/cointraffic/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Webhook endpoint for Cointraffic to report ad revenue
 * Configure this URL in Cointraffic dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ad_unit_id,
      impressions,
      clicks,
      revenue, // In dollars
      date,
    } = body;

    // Find banner by partner ad unit ID
    const banner = await db
      .select()
      .from(banners)
      .where(eq(banners.partnerAdUnitId, ad_unit_id))
      .limit(1);

    if (banner.length === 0) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    // Update banner revenue
    const revenueInCents = Math.round(revenue * 100);
    await db
      .update(banners)
      .set({
        impressions: impressions,
        clicks: clicks,
        revenue: revenueInCents,
      })
      .where(eq(banners.id, banner[0].id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cointraffic webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

---

## 6. Performance Optimization

### 6.1 Caching Strategy

```typescript
// lib/cache/banner-cache.ts

import { redis } from "@/lib/redis";

export class BannerCache {
  private static CACHE_PREFIX = "banner:";
  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Cache banner selection for session
   */
  static async setBannerForSession(
    sessionId: string,
    placement: string,
    bannerId: string
  ) {
    const key = `${this.CACHE_PREFIX}${sessionId}:${placement}`;
    await redis.setex(key, this.CACHE_TTL, bannerId);
  }

  /**
   * Get cached banner selection
   */
  static async getBannerForSession(
    sessionId: string,
    placement: string
  ): Promise<string | null> {
    const key = `${this.CACHE_PREFIX}${sessionId}:${placement}`;
    return await redis.get(key);
  }

  /**
   * Cache banner data
   */
  static async setBannerData(bannerId: string, data: any) {
    const key = `${this.CACHE_PREFIX}data:${bannerId}`;
    await redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
  }

  /**
   * Get cached banner data
   */
  static async getBannerData(bannerId: string): Promise<any | null> {
    const key = `${this.CACHE_PREFIX}data:${bannerId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate banner cache
   */
  static async invalidateBanner(bannerId: string) {
    const pattern = `${this.CACHE_PREFIX}*:${bannerId}`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### 6.2 Lazy Loading & Code Splitting

```typescript
// Dynamic import for banner components
import dynamic from "next/dynamic";

const BannerManager = dynamic(
  () => import("@/components/banners/BannerManager").then((mod) => mod.BannerManager),
  {
    loading: () => <div className="banner-skeleton" />,
    ssr: false, // Disable SSR for banner components
  }
);
```

### 6.3 Image Optimization

```typescript
// next.config.ts additions

const config: NextConfig = {
  images: {
    domains: ["cdn.cointraffic.io", "cdn.coinzilla.com"],
    formats: ["image/avif", "image/webp"],
  },
};
```

---

## 7. Implementation Roadmap

### Phase 1: MVP Banner System (Week 1-2)

**Week 1: Core Infrastructure**
- [x] Database schema design
- [ ] Day 1: Run `npm run db:push` to create banner tables
- [ ] Day 2-3: Implement `BannerService` with selection logic
- [ ] Day 4-5: Build `BannerManager`, `BannerSlot`, `BannerRenderer` components
- [ ] Day 6-7: Create 3 banner templates (Leaderboard, Rectangle, Sticky)

**Week 2: Integration & Testing**
- [ ] Day 8-9: Integrate banners into `ScanInterface.tsx`
- [ ] Day 10-11: Implement analytics tracking (PostHog + database)
- [ ] Day 12: Create 5 initial banner variants (Upgrade, Comparison, Social Proof)
- [ ] Day 13: A/B testing framework setup
- [ ] Day 14: Testing & bug fixes

**Deliverables:**
- 3 banner placements (top, sidebar, bottom)
- 5 banner variants
- Full analytics tracking
- Basic A/B testing

**Target Metrics:**
- Banner CTR: >0.3%
- Conversion uplift: +15-25%
- Load time impact: <100ms

### Phase 2: External Ads & Optimization (Week 3-4)

**Week 3: External Ad Networks**
- [ ] Day 15-16: Cointraffic integration (signup, API keys, placement codes)
- [ ] Day 17-18: Implement external ad components and revenue tracking
- [ ] Day 19-20: Frequency capping and dismissal logic
- [ ] Day 21: GDPR consent integration

**Week 4: Optimization**
- [ ] Day 22-23: A/B test 10 banner variants (copy, design, CTA)
- [ ] Day 24-25: Performance optimization (caching, lazy loading)
- [ ] Day 26-27: Analytics dashboard for banner performance
- [ ] Day 28: Documentation and handoff

**Deliverables:**
- Cointraffic integration live
- 10+ banner variants tested
- Analytics dashboard
- Performance <500ms load time

**Target Metrics:**
- Banner CTR: >0.5%
- Conversion rate: 3-4%
- Partner ad revenue: €200-400/month (at 5K users)

### Phase 3: Advanced Features (Month 2-3)

**Advanced Targeting & Personalization**
- Dynamic banners with real-time stats
- Geo-targeting (US vs EU offers)
- Behavioral retargeting
- Gamified progression banners

**Revenue Expansion**
- Add Coinzilla network
- Animated HTML5 banners
- Video banner tests
- Sponsored audit banners

**Enterprise Features**
- White-label banner system
- Affiliate program integration
- Custom banner builder UI

**Target Metrics:**
- Banner CTR: >0.8% (dynamic banners)
- Revenue: €2-5K/month (at 30K users)

---

## 8. Success Metrics & KPIs

### 8.1 Performance Metrics

| Metric | MVP Target | Optimized Target | Industry Benchmark |
|--------|-----------|------------------|-------------------|
| CTR (Internal Banners) | 0.3% | 0.8% | 0.18-0.35% |
| CTR (External Ads) | 0.2% | 0.4% | 0.18-0.35% |
| Conversion Rate | 2% | 4% | 2-5% |
| Load Time Impact | <200ms | <100ms | <500ms |
| Cache Hit Rate | 70% | 85% | 80% |

### 8.2 Revenue Projections

**At 20K Free Users (Month 3):**
- Internal banner conversion lift: €500-1K/month
- External partner ads: €600/month
- **Total: €1.1-1.6K/month**

**At 50K Free Users (Month 6):**
- Internal banner conversion lift: €3-5K/month
- External partner ads: €1.5K/month
- **Total: €4.5-6.5K/month**

**At 100K Free Users (Month 12):**
- Internal banner conversion lift: €10-15K/month
- External partner ads: €3-5K/month
- **Total: €13-20K/month**

### 8.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Complaints | <5% | User feedback surveys |
| Banner Dismissal Rate | <30% | Dismissal tracking |
| Page Bounce Rate Impact | <5% increase | Google Analytics |
| User Satisfaction Score | >3.5/5 | Post-scan surveys |

---

## 9. Risk Mitigation

### 9.1 UX Degradation Risk

**Risk**: Banners annoy users and increase churn

**Mitigation:**
- Frequency caps (max 3 impressions per session)
- Dismissible banners (24-hour cooldown)
- A/B test impact on retention metrics
- Only show banners after scan completion (never during)
- Mobile-first design (60% of users on mobile)

### 9.2 Performance Risk

**Risk**: Banner system slows down page load

**Mitigation:**
- Lazy loading with dynamic imports
- Redis caching (5-minute TTL)
- CDN for banner assets
- Async script loading for external ads
- Performance budget: <100ms impact

### 9.3 Ad Network Reliability Risk

**Risk**: External ad networks have downtime or low fill rates

**Mitigation:**
- Fallback to internal banners when external ads fail
- Multi-network strategy (Cointraffic + Coinzilla)
- Monitor fill rate and revenue in real-time
- Direct deals with crypto projects as backup

### 9.4 Regulatory Compliance Risk

**Risk**: GDPR/CCPA violations from ad tracking

**Mitigation:**
- Cookie consent before showing ads
- Privacy policy disclosure
- User opt-out mechanism
- No PII in banner tracking
- Regular compliance audits

---

## 10. Monitoring & Alerting

### 10.1 Real-Time Monitoring

```typescript
// lib/monitoring/banner-monitor.ts

export class BannerMonitor {
  /**
   * Check banner system health
   */
  static async healthCheck() {
    const metrics = {
      activeBanners: 0,
      impressionsLast24h: 0,
      clicksLast24h: 0,
      averageCTR: 0,
      externalAdFillRate: 0,
      cacheHitRate: 0,
    };

    // Query metrics from database
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Active banners
    metrics.activeBanners = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .then((rows) => rows.length);

    // Impressions and clicks
    const recentImpressions = await db
      .select()
      .from(bannerImpressions)
      .where(gte(bannerImpressions.createdAt, oneDayAgo));

    metrics.impressionsLast24h = recentImpressions.length;
    metrics.clicksLast24h = recentImpressions.filter((i) => i.wasClicked).length;
    metrics.averageCTR = metrics.impressionsLast24h > 0
      ? (metrics.clicksLast24h / metrics.impressionsLast24h) * 100
      : 0;

    return metrics;
  }

  /**
   * Alert on anomalies
   */
  static async checkAnomalies() {
    const metrics = await this.healthCheck();
    const alerts = [];

    // CTR too low
    if (metrics.averageCTR < 0.1) {
      alerts.push({
        severity: "warning",
        message: `Low CTR detected: ${metrics.averageCTR.toFixed(2)}%`,
      });
    }

    // No impressions
    if (metrics.impressionsLast24h === 0) {
      alerts.push({
        severity: "critical",
        message: "Zero banner impressions in last 24 hours",
      });
    }

    return alerts;
  }
}
```

### 10.2 Alert Configuration

**Critical Alerts** (Immediate notification):
- Zero banner impressions for >2 hours
- External ad network downtime
- Database errors in banner tracking

**Warning Alerts** (Daily digest):
- CTR drops below 0.1%
- Conversion rate drops below 1%
- Cache hit rate below 70%

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// __tests__/services/banner.service.test.ts

import { BannerService } from "@/lib/services/banner.service";

describe("BannerService", () => {
  describe("selectBanner", () => {
    it("should select banner matching user type", async () => {
      const banner = await BannerService.selectBanner({
        placement: "top_leaderboard",
        sessionId: "test-session",
        scanCount: 5,
        userType: "free",
      });

      expect(banner).toBeDefined();
      expect(banner.targetUserType).toMatch(/free|all/);
    });

    it("should respect scan count targeting", async () => {
      const banner = await BannerService.selectBanner({
        placement: "top_leaderboard",
        sessionId: "test-session",
        scanCount: 2,
      });

      if (banner && banner.minScans) {
        expect(banner.minScans).toBeLessThanOrEqual(2);
      }
    });

    it("should return null when no eligible banners", async () => {
      const banner = await BannerService.selectBanner({
        placement: "non_existent_placement",
        sessionId: "test-session",
      });

      expect(banner).toBeNull();
    });
  });

  describe("filterByFrequencyCap", () => {
    it("should filter out banners exceeding frequency cap", async () => {
      // Test implementation
    });
  });
});
```

### 11.2 Integration Tests

```typescript
// __tests__/api/banners/select.test.ts

import { POST } from "@/app/api/banners/select/route";

describe("/api/banners/select", () => {
  it("should return banner for valid request", async () => {
    const request = new Request("http://localhost/api/banners/select", {
      method: "POST",
      body: JSON.stringify({
        placement: "top_leaderboard",
        sessionId: "test-session",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banner).toBeDefined();
  });

  it("should return 400 for missing fields", async () => {
    const request = new Request("http://localhost/api/banners/select", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### 11.3 E2E Tests (Playwright)

```typescript
// e2e/banners.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Banner System", () => {
  test("should display banner after scan completion", async ({ page }) => {
    await page.goto("/");

    // Perform scan
    await page.fill('input[placeholder="0x..."]', "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    await page.click("button:has-text('SCAN CONTRACT')");

    // Wait for results
    await page.waitForSelector(".scan-results");

    // Check for banner
    const banner = await page.waitForSelector(".banner-slot");
    expect(banner).toBeTruthy();
  });

  test("should track banner click", async ({ page }) => {
    await page.goto("/");

    // ... perform scan ...

    // Click banner
    const banner = await page.waitForSelector(".banner-slot");
    await banner.click();

    // Verify tracking (check network request)
    const tracking = await page.waitForResponse(
      (response) => response.url().includes("/api/banners/click")
    );
    expect(tracking.status()).toBe(200);
  });

  test("should respect dismissal", async ({ page }) => {
    await page.goto("/");

    // ... perform scan ...

    // Dismiss banner
    const dismissBtn = await page.waitForSelector("button[aria-label='Dismiss']");
    await dismissBtn.click();

    // Verify banner is gone
    const banner = await page.$(".banner-slot");
    expect(banner).toBeNull();
  });
});
```

---

## 12. Documentation & Handoff

### 12.1 Developer Documentation

**Setup Instructions:**
1. Run `npm run db:push` to create banner tables
2. Add environment variables (if using external ad networks)
3. Seed initial banner data: `npm run seed:banners`
4. Test banner selection: `npm run test:banners`

**Common Tasks:**
- Creating new banner: Add to `banners` table via Drizzle Studio
- Testing A/B variants: Use `/api/banners/ab-test?variantGroup=X`
- Viewing analytics: Access PostHog dashboard or `/api/banners/analytics`

### 12.2 Content Team Documentation

**Banner Content Guidelines:**
- Headlines: <10 words, action-oriented
- Body: <20 words, clear value proposition
- CTA: Action verbs ("Upgrade", "Try", "Get", "Unlock")
- Design: High contrast, mobile-optimized, accessible

**Banner Placement Best Practices:**
- Top Leaderboard: Feature highlights, urgent offers
- Sidebar Rectangle: Comparison charts, social proof
- Bottom Sticky (Mobile): Limit warnings, quick CTAs
- Modal Overlay: Major announcements, critical paywalls

### 12.3 Analytics Team Documentation

**Key Metrics to Monitor:**
- CTR by placement, user type, scan count
- Conversion attribution (last-click, 7-day window)
- Revenue per impression (RPI)
- A/B test significance and winning variants

**Dashboard Links:**
- PostHog banner events: `https://app.posthog.com/events?filter=banner_*`
- Internal analytics: `/api/banners/analytics`
- A/B test results: `/api/banners/ab-test`

---

## Conclusion

This comprehensive design specification provides a production-ready banner monetization system for ContractGuard AI, targeting **€13-20K/month** at 100K free users through intelligent targeting, A/B testing, and dual revenue streams.

**Next Steps:**
1. Review and approve design with stakeholders
2. Begin Phase 1 implementation (Week 1-2)
3. Set up monitoring and analytics dashboards
4. Coordinate with design team for banner assets
5. Establish relationship with Cointraffic for external ads

**Success Criteria:**
- ✅ Banner CTR >0.3% (MVP), >0.8% (optimized)
- ✅ Conversion rate >3%
- ✅ Load time impact <100ms
- ✅ User satisfaction >3.5/5
- ✅ Revenue €1-2K/month within 60 days
