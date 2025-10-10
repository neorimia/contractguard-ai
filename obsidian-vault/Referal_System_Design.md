# ContractGuard AI - Referral System Design Specification

## 📋 Executive Summary

Complete referral system design with unique links, rewards engine, anti-fraud protection, conversion tracking, and optional Stripe affiliate commission integration.

**Success Metrics (Target)**:
- Invite → Signup: ≥15%
- Confirmed Rate: ≥10%
- Referral → Paid: ≥3%

---

## 1. Database Schema Design

### 1.1 Schema Changes Overview

**Modifications to Existing Tables**: 1 (users)
**New Tables**: 4 (referrals, referral_events, rewards_ledger, bonus_scans)

### 1.2 Users Table Extensions

```typescript
// db/schema.ts - Add to existing users table
export const users = pgTable("users", {
  // ... existing fields ...

  // Referral System Fields
  referralCode: text("referral_code").unique(), // Format: CG-XXXXXX
  referredBy: text("referred_by"), // Stores referrer's referral_code
  bonusScans: integer("bonus_scans").default(0), // Accumulated bonus scans
  bonusScanUsedToday: integer("bonus_scans_used_today").default(0), // Track daily usage
});
```

**Design Rationale**:
- `referralCode`: Self-contained unique identifier using nanoid(6) → compact, URL-safe
- `referredBy`: Stores code instead of user ID → enables tracking before user registration
- `bonusScans`: Accumulated rewards pool separate from daily limits
- `bonusScanUsedToday`: Prevents bonus scan abuse by tracking daily usage

### 1.3 Referrals Table

```typescript
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Relationship
  referrerId: integer("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredId: integer("referred_id")
    .references(() => users.id, { onDelete: "set null" }),

  // Status Tracking
  status: text("status", {
    enum: ["pending", "confirmed", "rewarded", "cancelled"]
  }).notNull().default("pending"),

  // Reward Configuration
  rewardType: text("reward_type", {
    enum: ["scans", "trial", "discount", "credit"]
  }),
  rewardAmount: integer("reward_amount"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  rewardedAt: timestamp("rewarded_at", { withTimezone: true }),

  // Metadata
  metadata: jsonb("metadata").$type<{
    landingIp?: string;
    signupIp?: string;
    confirmIp?: string;
    source?: string; // twitter, telegram, direct, etc.
  }>(),
});

// Indexes for performance
export const referralsReferrerIdIdx = index("referrals_referrer_id_idx")
  .on(referrals.referrerId);
export const referralsReferredIdIdx = index("referrals_referred_id_idx")
  .on(referrals.referredId);
export const referralsStatusIdx = index("referrals_status_idx")
  .on(referrals.status);
```

**Status Flow**:
1. **pending** → User clicked link, cookie set, waiting for signup
2. **confirmed** → User completed first meaningful action (audit/email verify)
3. **rewarded** → Referrer received their reward
4. **cancelled** → Detected as fraud or user deleted

**Design Decisions**:
- UUID primary key → distributed system compatibility
- Cascade delete on referrer → clean up orphaned referrals
- Set null on referred → preserve analytics if user deletes account
- JSONB metadata → flexible for future tracking needs

### 1.4 Referral Events Table (Anti-Fraud Tracking)

```typescript
export const referralEvents = pgTable("referral_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Relationship
  referralId: text("referral_id")
    .notNull()
    .references(() => referrals.id, { onDelete: "cascade" }),

  // Event Type
  event: text("event", {
    enum: ["landing", "signup", "first_audit", "email_verified", "paid", "payout"]
  }).notNull(),

  // Anti-Fraud Data
  ip: text("ip"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"), // FingerprintJS hash
  deviceType: text("device_type"), // mobile, desktop, tablet

  // Additional Context
  metadata: jsonb("metadata").$type<{
    referer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    country?: string;
    city?: string;
  }>(),

  // Timestamp
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Indexes
export const referralEventsReferralIdIdx = index("referral_events_referral_id_idx")
  .on(referralEvents.referralId);
export const referralEventsEventIdx = index("referral_events_event_idx")
  .on(referralEvents.event);
export const referralEventsCreatedAtIdx = index("referral_events_created_at_idx")
  .on(referralEvents.createdAt);
```

**Anti-Fraud Strategy**:
- Track complete user journey: landing → signup → confirmation → payment
- Device fingerprinting prevents multi-account abuse
- IP + UA correlation detects suspicious patterns
- Geographic data helps identify bot farms

### 1.5 Rewards Ledger Table

```typescript
export const rewardsLedger = pgTable("rewards_ledger", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Relationship
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  referralId: text("referral_id")
    .references(() => referrals.id, { onDelete: "set null" }),

  // Reward Details
  type: text("type", {
    enum: ["scans", "trial", "discount", "credit", "pro_month"]
  }).notNull(),

  amount: integer("amount").notNull(), // Scans count or cents for credit

  // Status
  status: text("status", {
    enum: ["pending", "applied", "expired", "revoked"]
  }).notNull().default("pending"),

  // Application Tracking
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  // Metadata
  metadata: jsonb("metadata").$type<{
    description?: string;
    stripeInvoiceId?: string;
    promoCode?: string;
  }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Indexes
export const rewardsLedgerUserIdIdx = index("rewards_ledger_user_id_idx")
  .on(rewardsLedger.userId);
export const rewardsLedgerStatusIdx = index("rewards_ledger_status_idx")
  .on(rewardsLedger.status);
```

**Ledger Design Principles**:
- Immutable record → audit trail for all rewards
- Separate status tracking → rewards can be revoked if fraud detected
- Expiration support → time-limited promotions
- Stripe integration ready → stores invoice IDs for credits

### 1.6 Type Exports

```typescript
// Type inference
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type NewReferralEvent = typeof referralEvents.$inferInsert;
export type RewardLedger = typeof rewardsLedger.$inferSelect;
export type NewRewardLedger = typeof rewardsLedger.$inferInsert;
```

---

## 2. Referral Configuration

### 2.1 Reward Rules Configuration

```typescript
// lib/referrals/config.ts

export const referralConfig = {
  // Code Generation
  codePrefix: "CG",
  codeLength: 6, // Results in CG-XXXXXX

  // Rewards for Referred User (signup bonus)
  signupBonusForReferred: {
    type: "scans" as const,
    amount: 3,
    description: "Welcome bonus for joining via referral",
  },

  // Rewards for Referrer (after confirmation)
  confirmBonusForReferrer: {
    type: "scans" as const,
    amount: 5,
    description: "Earned from successful referral",
  },

  // Rewards for Referrer (after Pro conversion)
  proBonusForReferrer: {
    type: "credit" as const,
    amount: 580, // 20% of $29 = $5.80 in cents
    description: "Affiliate commission for Pro referral",
  },

  // Alternative: Give 1 month Pro instead
  proMonthBonusForReferrer: {
    type: "pro_month" as const,
    amount: 1,
    description: "1 month Pro subscription",
  },

  // Anti-Fraud Limits
  dailyInviteCap: 10, // Max new referrals per day
  maxPendingReferrals: 50, // Max unconfirmed referrals

  // Cookie Settings
  cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  cookieName: "cg_ref",

  // Confirmation Requirements
  confirmationTriggers: [
    "first_audit_complete", // User completed their first scan
    "email_verified", // User verified their email
  ] as const,

  // Expiration
  rewardExpirationDays: 365, // Bonus scans expire after 1 year
} as const;

export type ReferralConfigType = typeof referralConfig;
```

### 2.2 Anti-Fraud Rules

```typescript
// lib/referrals/antifraud.ts

export interface FraudCheckResult {
  isValid: boolean;
  reason?: string;
  riskScore: number; // 0-100
  flags: string[];
}

export const antifraudRules = {
  // IP-based checks
  sameIpThreshold: 3, // Max 3 signups from same IP per day

  // Email validation
  disposableEmailDomains: [
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    // ... more domains
  ],

  // Device fingerprint
  sameFingerprintThreshold: 2, // Max 2 signups per fingerprint

  // Time-based anomalies
  minTimeBetweenLandingAndSignup: 10, // seconds - too fast = bot
  maxTimeBetweenLandingAndSignup: 7 * 24 * 60 * 60, // 7 days - cookie expiry

  // Behavioral patterns
  requiredActionsForConfirmation: 1, // Min actions before confirming referral

  // Risk score thresholds
  riskScoreThresholds: {
    low: 25,
    medium: 50,
    high: 75,
  },
} as const;
```

---

## 3. Service Layer Architecture

### 3.1 ReferralService

```typescript
// lib/services/referral.service.ts

export class ReferralService {
  /**
   * Generate unique referral code for user
   * Format: CG-XXXXXX (uppercase alphanumeric, no ambiguous chars)
   */
  async generateReferralCode(): Promise<string>;

  /**
   * Validate referral code exists and is active
   */
  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referrer?: User;
    error?: string;
  }>;

  /**
   * Create referral record when user lands on /ref/[code]
   */
  async createReferral(params: {
    referrerCode: string;
    metadata?: {
      ip?: string;
      userAgent?: string;
      fingerprint?: string;
      source?: string;
    };
  }): Promise<Referral>;

  /**
   * Complete referral on signup
   */
  async completeSignup(params: {
    referralId: string;
    referredUserId: number;
    metadata?: {
      ip?: string;
      userAgent?: string;
      fingerprint?: string;
    };
  }): Promise<{ success: boolean; reward?: RewardLedger }>;

  /**
   * Confirm referral after meaningful action
   */
  async confirmReferral(params: {
    referredUserId: number;
    trigger: "first_audit_complete" | "email_verified";
    metadata?: {
      ip?: string;
      userAgent?: string;
    };
  }): Promise<{ success: boolean; reward?: RewardLedger }>;

  /**
   * Process paid conversion
   */
  async processPaidConversion(params: {
    referredUserId: number;
    stripeInvoiceId?: string;
  }): Promise<{ success: boolean; reward?: RewardLedger }>;

  /**
   * Get referral stats for user dashboard
   */
  async getReferralStats(userId: number): Promise<{
    totalInvites: number;
    pendingInvites: number;
    confirmedInvites: number;
    totalEarned: {
      scans: number;
      credits: number;
    };
    recentReferrals: Referral[];
  }>;

  /**
   * Check if user can create new referrals (rate limiting)
   */
  async canCreateReferral(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: Date;
  }>;
}
```

### 3.2 RewardsService

```typescript
// lib/services/rewards.service.ts

export interface RewardConfig {
  type: "scans" | "trial" | "discount" | "credit" | "pro_month";
  amount: number;
  description?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class RewardsService {
  /**
   * Apply reward to user account
   * Handles different reward types and updates user balance
   */
  async applyReward(
    userId: number,
    reward: RewardConfig,
    referralId?: string
  ): Promise<RewardLedger>;

  /**
   * Get total bonus scans available for user
   */
  async getBonusScansBalance(userId: number): Promise<number>;

  /**
   * Consume bonus scan (when user performs audit)
   */
  async consumeBonusScan(userId: number): Promise<{
    success: boolean;
    remainingBonus: number;
  }>;

  /**
   * Reset daily bonus scan usage counter
   */
  async resetDailyBonusUsage(userId: number): Promise<void>;

  /**
   * Apply credit to user's Stripe account
   */
  async applyStripeCredit(
    userId: number,
    amountInCents: number,
    description: string
  ): Promise<{ success: boolean; creditId?: string }>;

  /**
   * Grant Pro subscription for specified duration
   */
  async grantProTrial(
    userId: number,
    durationDays: number
  ): Promise<{ success: boolean }>;

  /**
   * Get reward history for user
   */
  async getRewardHistory(userId: number): Promise<RewardLedger[]>;

  /**
   * Revoke reward (fraud detection)
   */
  async revokeReward(
    rewardId: string,
    reason: string
  ): Promise<{ success: boolean }>;
}
```

### 3.3 AntiFraudService

```typescript
// lib/services/antifraud.service.ts

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
  fingerprint?: string;
  deviceType?: string;
  referer?: string;
}

export class AntiFraudService {
  /**
   * Analyze referral for fraud indicators
   */
  async analyzeFraud(params: {
    referralId: string;
    clientInfo: ClientInfo;
  }): Promise<FraudCheckResult>;

  /**
   * Check if IP is suspicious
   */
  async checkIpReputation(ip: string): Promise<{
    isSuspicious: boolean;
    reason?: string;
    signupsToday: number;
  }>;

  /**
   * Validate email domain
   */
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    isDisposable: boolean;
  }>;

  /**
   * Check fingerprint usage
   */
  async checkFingerprint(fingerprint: string): Promise<{
    isSuspicious: boolean;
    usageCount: number;
  }>;

  /**
   * Validate referral timing
   */
  async validateTiming(referralId: string): Promise<{
    isValid: boolean;
    reason?: string;
  }>;

  /**
   * Block user from creating referrals
   */
  async blockUser(userId: number, reason: string): Promise<void>;

  /**
   * Get fraud statistics for admin dashboard
   */
  async getFraudStats(): Promise<{
    blockedReferrals: number;
    suspiciousPatterns: number;
    falsePositiveRate: number;
  }>;
}
```

### 3.4 ReferralEventsService

```typescript
// lib/services/referral-events.service.ts

export class ReferralEventsService {
  /**
   * Log referral event
   */
  async logEvent(params: {
    referralId: string;
    event: "landing" | "signup" | "first_audit" | "email_verified" | "paid" | "payout";
    clientInfo: ClientInfo;
    metadata?: Record<string, any>;
  }): Promise<ReferralEvent>;

  /**
   * Get event timeline for referral
   */
  async getEventTimeline(referralId: string): Promise<ReferralEvent[]>;

  /**
   * Get events by type
   */
  async getEventsByType(
    event: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      userId?: number;
    }
  ): Promise<ReferralEvent[]>;
}
```

---

## 4. API Routes Design

### 4.1 Public API Routes

#### GET /api/referrals/validate/[code]
**Purpose**: Validate referral code and get referrer info
**Auth**: None (public)
**Response**:
```typescript
{
  valid: boolean;
  referrer?: {
    displayName: string;
    avatarUrl?: string;
  };
  error?: string;
}
```

#### POST /api/referrals/track-landing
**Purpose**: Track landing on referral page
**Auth**: None (public)
**Body**:
```typescript
{
  code: string;
  clientInfo: {
    fingerprint?: string;
    source?: string;
  };
}
```

### 4.2 Protected API Routes

#### POST /api/referrals/confirm
**Purpose**: Confirm referral after meaningful action
**Auth**: Required
**Body**:
```typescript
{
  trigger: "first_audit_complete" | "email_verified";
}
```
**Response**:
```typescript
{
  success: boolean;
  reward?: {
    type: string;
    amount: number;
    description: string;
  };
}
```

#### GET /api/referrals/stats
**Purpose**: Get referral statistics for dashboard
**Auth**: Required
**Response**:
```typescript
{
  referralCode: string;
  referralLink: string;
  stats: {
    totalInvites: number;
    confirmed: number;
    pending: number;
    earned: {
      scans: number;
      credits: number;
    };
  };
  recentReferrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    confirmedAt?: string;
  }>;
}
```

#### GET /api/referrals/history
**Purpose**: Get detailed referral history
**Auth**: Required
**Response**:
```typescript
{
  referrals: Array<{
    id: string;
    referredUser?: {
      displayName: string;
      email: string; // masked: j***@example.com
    };
    status: string;
    reward?: {
      type: string;
      amount: number;
    };
    createdAt: string;
    confirmedAt?: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

### 4.3 Webhook Routes

#### POST /api/stripe/webhook
**Purpose**: Handle Stripe events for Pro conversions
**Auth**: Stripe signature verification
**Events Handled**:
- `checkout.session.completed`: Award affiliate reward
- `customer.subscription.deleted`: Track churn
- `invoice.payment_succeeded`: Apply credits

---

## 5. Server Utilities

### 5.1 Client Info Extraction

```typescript
// lib/utils/client-info.ts

import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function getClientInfo(
  request?: NextRequest
): Promise<ClientInfo> {
  const headersList = request ? request.headers : await headers();

  return {
    ip: headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        "unknown",
    userAgent: headersList.get("user-agent") || "unknown",
    fingerprint: headersList.get("x-fingerprint") || undefined,
    deviceType: getDeviceType(headersList.get("user-agent")),
    referer: headersList.get("referer") || undefined,
  };
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "unknown";

  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}
```

### 5.2 Referral Code Generator

```typescript
// lib/utils/referral-code.ts

import { customAlphabet } from "nanoid";

// Remove ambiguous characters: 0, O, I, L, 1
const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 6);

export function generateReferralCode(): string {
  return `${referralConfig.codePrefix}-${nanoid()}`;
}

export function validateReferralCodeFormat(code: string): boolean {
  const pattern = new RegExp(
    `^${referralConfig.codePrefix}-[${alphabet}]{${referralConfig.codeLength}}$`
  );
  return pattern.test(code);
}
```

### 5.3 Cookie Management

```typescript
// lib/utils/referral-cookies.ts

import { cookies } from "next/headers";

export async function setReferralCookie(code: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(referralConfig.cookieName, code, {
    maxAge: referralConfig.cookieMaxAge,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function getReferralCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(referralConfig.cookieName)?.value || null;
}

export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(referralConfig.cookieName);
}
```

---

## 6. Middleware Integration

### 6.1 Referral Middleware

```typescript
// middleware.ts (add to existing middleware)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle referral landing pages
  if (pathname.startsWith("/ref/")) {
    const code = pathname.split("/")[2];

    if (code) {
      // Validate code format
      if (!validateReferralCodeFormat(code)) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Set cookie
      const response = NextResponse.next();
      response.cookies.set(referralConfig.cookieName, code, {
        maxAge: referralConfig.cookieMaxAge,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return response;
    }
  }

  // Existing middleware logic...
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ref/:code*",
    "/api/:path*",
    // ... other matchers
  ],
};
```

---

## 7. Stack Auth Integration

### 7.1 Post-Signup Hook

```typescript
// app/api/auth/callback/route.ts (or Stack Auth webhook handler)

import { ReferralService } from "@/lib/services/referral.service";
import { RewardsService } from "@/lib/services/rewards.service";
import { getReferralCookie, clearReferralCookie } from "@/lib/utils/referral-cookies";

export async function POST(request: Request) {
  try {
    // Get Stack Auth user data
    const { stackUserId, email } = await request.json();

    // Sync user to database
    const authService = new AuthService();
    const user = await authService.syncUser(stackUserId, email);

    // Check for referral cookie
    const referralCode = await getReferralCookie();

    if (referralCode) {
      const referralService = new ReferralService();
      const rewardsService = new RewardsService();

      // Complete signup process
      const result = await referralService.completeSignup({
        referralCode,
        referredUserId: user.id,
        metadata: await getClientInfo(),
      });

      if (result.success && result.reward) {
        // Apply signup bonus to new user
        await rewardsService.applyReward(
          user.id,
          referralConfig.signupBonusForReferred
        );

        // Clear cookie
        await clearReferralCookie();
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Auth callback error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### 7.2 First Audit Trigger

```typescript
// app/api/scan/route.ts (add to existing scan endpoint)

import { ReferralService } from "@/lib/services/referral.service";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  // ... existing scan logic ...

  // Check if this is user's first audit
  const isFirstAudit = user.scansToday === 1; // After increment

  if (isFirstAudit) {
    const referralService = new ReferralService();

    // Confirm referral (non-blocking)
    referralService.confirmReferral({
      referredUserId: user.id,
      trigger: "first_audit_complete",
      metadata: await getClientInfo(request),
    }).catch(error => {
      console.error("Failed to confirm referral:", error);
    });
  }

  // ... continue with scan response ...
}
```

---

## 8. UI Components Design

### 8.1 ReferralBanner Component

```typescript
// components/referrals/ReferralBanner.tsx
"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralBannerProps {
  code: string;
  stats: {
    confirmed: number;
    earned: { scans: number };
  };
}

export function ReferralBanner({ code, stats }: ReferralBannerProps) {
  const [copied, setCopied] = useState(false);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/ref/${code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <h3 className="text-xl font-bold">
          Invite Friends, Earn Rewards 💎
        </h3>

        <p className="mt-2 text-sm text-white/90">
          Share your unique link. You get <strong>+5 scans</strong> for each friend who joins.
          They get <strong>+3 scans</strong> as a welcome bonus!
        </p>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-white/70">Friends Joined</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.earned.scans}</div>
            <div className="text-white/70">Scans Earned</div>
          </div>
        </div>

        {/* Link input */}
        <div className="mt-6 flex gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          <Button
            onClick={handleCopy}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              // Open native share dialog
              if (navigator.share) {
                navigator.share({
                  title: "Join ContractGuard AI",
                  text: "Check out ContractGuard AI - AI-powered smart contract security scanner!",
                  url: link,
                });
              }
            }}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 8.2 ReferralStats Component

```typescript
// components/referrals/ReferralStats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReferralStatsProps {
  referrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    confirmedAt?: string;
    reward?: {
      type: string;
      amount: number;
    };
  }>;
}

export function ReferralStats({ referrals }: ReferralStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {referral.status === "confirmed" ? "Friend joined!" : "Pending"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <Badge
                    variant={
                      referral.status === "confirmed" ? "default" : "secondary"
                    }
                  >
                    {referral.status}
                  </Badge>

                  {referral.reward && (
                    <div className="mt-1 text-sm font-medium text-green-600">
                      +{referral.reward.amount} scans
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 8.3 ReferralLandingPage Component

```typescript
// app/ref/[code]/page.tsx

import { validateReferralCode } from "@/lib/services/referral.service";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function ReferralLandingPage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;

  // Validate code and get referrer info
  const validation = await validateReferralCode(code);

  if (!validation.valid) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Referral Link</h1>
          <p className="mt-2 text-muted-foreground">
            This referral link is not valid or has expired.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { referrer } = validation;

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        {/* Referrer info */}
        {referrer?.displayName && (
          <div className="mb-6 flex items-center justify-center gap-3">
            {referrer.avatarUrl && (
              <img
                src={referrer.avatarUrl}
                alt={referrer.displayName}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div className="text-lg">
              <span className="font-semibold">{referrer.displayName}</span>
              {" invited you to join"}
            </div>
          </div>
        )}

        {/* Hero */}
        <h1 className="text-4xl font-bold sm:text-5xl">
          AI-Powered Smart Contract Security
        </h1>

        <p className="mt-4 text-xl text-muted-foreground">
          Detect scams, honeypots, and rug pulls before you invest
        </p>

        {/* Benefits */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-center gap-2 text-lg">
            <CheckCircle className="text-green-600" size={24} />
            <span>Get <strong>+3 free scans</strong> when you sign up</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-lg">
            <CheckCircle className="text-green-600" size={24} />
            <span>Instant AI-powered security analysis</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-lg">
            <CheckCircle className="text-green-600" size={24} />
            <span>Protect your crypto investments</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">Learn More</Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <p className="mt-8 text-sm text-muted-foreground">
          Join 10,000+ crypto traders who trust ContractGuard AI
        </p>
      </div>
    </div>
  );
}
```

---

## 9. Email Notifications

### 9.1 Email Templates

```typescript
// emails/referral-reward.tsx

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
} from "@react-email/components";

interface ReferralRewardEmailProps {
  displayName?: string;
  rewardAmount: number;
  rewardType: "scans" | "credit";
}

export default function ReferralRewardEmail({
  displayName,
  rewardAmount,
  rewardType,
}: ReferralRewardEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>🎉 You earned a referral reward!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            🎉 Congratulations{displayName ? `, ${displayName}` : ""}!
          </Heading>

          <Text style={text}>
            Great news! One of your friends just joined ContractGuard AI,
            and you've earned a reward:
          </Text>

          <div style={rewardBox}>
            <Text style={rewardAmount}>
              +{rewardAmount} {rewardType === "scans" ? "Scans" : "Credits"}
            </Text>
          </div>

          <Text style={text}>
            Your reward has been added to your account and is ready to use.
            Keep sharing your referral link to earn even more!
          </Text>

          <Button
            href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`}
            style={button}
          >
            View Dashboard
          </Button>

          <Text style={footer}>
            Want to earn more? Share your unique referral link with friends!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
};

const rewardBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const rewardAmount = {
  color: "#16a34a",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "32px auto",
  width: "200px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
};
```

### 9.2 Email Service Integration

```typescript
// lib/services/email.service.ts (add methods)

export class EmailService {
  // ... existing methods ...

  async sendReferralRewardEmail(
    email: string,
    params: {
      displayName?: string;
      rewardAmount: number;
      rewardType: "scans" | "credit";
    }
  ): Promise<void> {
    const { displayName, rewardAmount, rewardType } = params;

    const html = await render(
      ReferralRewardEmail({
        displayName,
        rewardAmount,
        rewardType,
      })
    );

    await this.resend.emails.send({
      from: "ContractGuard AI <notifications@contractguard.ai>",
      to: email,
      subject: "🎉 You earned a referral reward!",
      html,
    });
  }

  async sendWelcomeBonusEmail(
    email: string,
    params: {
      displayName?: string;
      bonusScans: number;
      referrerName?: string;
    }
  ): Promise<void> {
    // Similar implementation for new users
  }
}
```

---

## 10. Stripe Integration (Optional)

### 10.1 Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts

import Stripe from "stripe";
import { headers } from "next/headers";
import { ReferralService } from "@/lib/services/referral.service";
import { AuthService } from "@/lib/services/auth.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get user from Stripe customer ID
        const authService = new AuthService();
        const user = await authService.getUserByStripeCustomerId(
          session.customer as string
        );

        if (user) {
          const referralService = new ReferralService();

          // Process paid conversion
          await referralService.processPaidConversion({
            referredUserId: user.id,
            stripeInvoiceId: session.invoice as string,
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        // Track churn for analytics
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

### 10.2 Credit Application

```typescript
// lib/services/rewards.service.ts (add method)

async applyStripeCredit(
  userId: number,
  amountInCents: number,
  description: string
): Promise<{ success: boolean; creditId?: string }> {
  try {
    const authService = new AuthService();
    const user = await authService.getUserById(userId);

    if (!user?.stripeCustomerId) {
      throw new Error("User has no Stripe customer ID");
    }

    // Create customer balance transaction (credit)
    const credit = await stripe.customers.createBalanceTransaction(
      user.stripeCustomerId,
      {
        amount: -amountInCents, // Negative = credit
        currency: "usd",
        description,
      }
    );

    // Record in ledger
    await db.insert(rewardsLedger).values({
      userId: user.id,
      type: "credit",
      amount: amountInCents,
      status: "applied",
      appliedAt: new Date(),
      metadata: {
        description,
        stripeBalanceTxnId: credit.id,
      },
    });

    return { success: true, creditId: credit.id };
  } catch (error) {
    console.error("Failed to apply Stripe credit:", error);
    return { success: false };
  }
}
```

---

## 11. Admin Dashboard (Optional)

### 11.1 Referral Analytics

```typescript
// app/admin/referrals/page.tsx

export default async function AdminReferralsPage() {
  // Fetch analytics
  const stats = await getReferralAnalytics();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold">Referral Analytics</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Rewards Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.rewardsPaid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fraud Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">
              {stats.fraudRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and detailed analytics */}
    </div>
  );
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// __tests__/services/referral.service.test.ts

describe("ReferralService", () => {
  describe("generateReferralCode", () => {
    it("generates unique codes", async () => {
      const service = new ReferralService();
      const codes = await Promise.all([
        service.generateReferralCode(),
        service.generateReferralCode(),
      ]);

      expect(codes[0]).not.toBe(codes[1]);
      expect(codes[0]).toMatch(/^CG-[A-Z0-9]{6}$/);
    });
  });

  describe("completeSignup", () => {
    it("creates referral and applies signup bonus", async () => {
      // Test implementation
    });

    it("detects fraud and marks as pending", async () => {
      // Test implementation
    });
  });
});
```

### 12.2 Integration Tests

```typescript
// __tests__/integration/referral-flow.test.ts

describe("Referral Flow Integration", () => {
  it("completes full referral cycle", async () => {
    // 1. Generate referral code
    // 2. Land on referral page
    // 3. Sign up with cookie
    // 4. Complete first audit
    // 5. Verify rewards distributed
  });

  it("handles fraud detection", async () => {
    // Test fraud scenarios
  });
});
```

---

## 13. Performance Considerations

### 13.1 Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referral_events_referral_id ON referral_events(referral_id);
CREATE INDEX idx_referral_events_event ON referral_events(event);
CREATE INDEX idx_rewards_ledger_user_id ON rewards_ledger(user_id);
CREATE INDEX idx_rewards_ledger_status ON rewards_ledger(status);
```

### 13.2 Caching Strategy

```typescript
// Cache referral stats in Redis (5 min TTL)
const CACHE_KEY = `referral:stats:${userId}`;
const CACHE_TTL = 300; // 5 minutes

async function getReferralStats(userId: number) {
  // Check cache
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const stats = await fetchFromDatabase(userId);

  // Cache result
  await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats));

  return stats;
}
```

---

## 14. Security Considerations

### 14.1 Rate Limiting

```typescript
// lib/utils/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Limit referral creation to 10 per day per user
export const referralRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 d"),
  prefix: "ratelimit:referral",
});

// Limit referral landing tracking to prevent spam
export const landingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  prefix: "ratelimit:landing",
});
```

### 14.2 Input Validation

```typescript
// lib/validations/referral.ts

import { z } from "zod";

export const referralCodeSchema = z
  .string()
  .regex(/^CG-[A-Z0-9]{6}$/, "Invalid referral code format");

export const trackLandingSchema = z.object({
  code: referralCodeSchema,
  clientInfo: z.object({
    fingerprint: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
});

export const confirmReferralSchema = z.object({
  trigger: z.enum(["first_audit_complete", "email_verified"]),
});
```

---

## 15. Deployment Checklist

### 15.1 Environment Variables

```bash
# Add to .env.local and production environment

# Referral System
APP_URL=https://contractguard.ai
REFERRAL_CODE_PREFIX=CG
REFERRAL_COOKIE_NAME=cg_ref
REFERRAL_COOKIE_MAX_AGE=604800

# Anti-Fraud (optional)
FINGERPRINT_API_KEY=your_fingerprint_api_key
```

### 15.2 Database Migration

```bash
# Generate migration
npm run db:generate

# Review generated SQL in drizzle/ folder

# Apply migration
npm run db:push

# Verify in Drizzle Studio
npm run db:studio
```

### 15.3 Pre-Launch Tasks

- [ ] Test referral code generation uniqueness
- [ ] Verify cookie setting/reading in production
- [ ] Test signup bonus application
- [ ] Test confirmation trigger from first audit
- [ ] Test Stripe webhook integration
- [ ] Load test referral endpoints
- [ ] Set up monitoring for fraud detection
- [ ] Configure email templates
- [ ] Test rate limiting
- [ ] Verify analytics tracking

---

## 16. Success Metrics & Monitoring

### 16.1 Key Metrics

```typescript
// lib/analytics/referral-metrics.ts

export interface ReferralMetrics {
  // Funnel metrics
  totalLandings: number;
  totalSignups: number;
  totalConfirmed: number;
  totalPaid: number;

  // Conversion rates
  landingToSignup: number; // Target: ≥15%
  signupToConfirmed: number; // Target: ≥10%
  confirmedToPaid: number; // Target: ≥3%

  // Performance metrics
  avgTimeToSignup: number; // hours
  avgTimeToConfirm: number; // hours
  avgTimeToPaid: number; // days

  // Quality metrics
  fraudRate: number;
  chargebackRate: number;

  // Economics
  totalRewardsPaid: number;
  revenueFromReferrals: number;
  roi: number;
}
```

### 16.2 Monitoring Alerts

- Fraud rate >5% → investigate
- Conversion rate <10% → optimize funnel
- Signup time >7 days → follow up
- Reward application failures → fix immediately

---

## 17. Future Enhancements

### 17.1 Phase 2 Features

- **Tiered rewards**: Higher rewards for Pro referrals
- **Leaderboards**: Gamify referrals with public rankings
- **Custom landing pages**: Personalized referral pages
- **Social sharing**: One-click Twitter/Telegram share
- **Referral contests**: Time-limited bonus campaigns

### 17.2 Phase 3 Features

- **Multi-level referrals**: Earn from referred users' referrals
- **Cryptocurrency payouts**: Pay rewards in crypto
- **Ambassador program**: Special status for top referrers
- **API access**: Allow partners to integrate referrals

---

## Appendix

### A. File Structure

```
contractguard-ai/
├── db/
│   └── schema.ts (add 4 new tables)
├── lib/
│   ├── referrals/
│   │   ├── config.ts
│   │   └── antifraud.ts
│   ├── services/
│   │   ├── referral.service.ts
│   │   ├── rewards.service.ts
│   │   ├── antifraud.service.ts
│   │   └── referral-events.service.ts
│   └── utils/
│       ├── client-info.ts
│       ├── referral-code.ts
│       └── referral-cookies.ts
├── app/
│   ├── ref/
│   │   └── [code]/
│   │       └── page.tsx
│   ├── api/
│   │   └── referrals/
│   │       ├── validate/[code]/route.ts
│   │       ├── track-landing/route.ts
│   │       ├── confirm/route.ts
│   │       ├── stats/route.ts
│   │       └── history/route.ts
│   └── dashboard/
│       └── referrals/
│           └── page.tsx
├── components/
│   └── referrals/
│       ├── ReferralBanner.tsx
│       ├── ReferralStats.tsx
│       └── ReferralHistory.tsx
└── emails/
    ├── referral-reward.tsx
    └── welcome-bonus.tsx
```

### B. Acceptance Criteria Summary

✅ Unique referral link functional: `/ref/CG-XXXXXX`
✅ Cookie `ref_code` set & read correctly at signup
✅ Referred user receives signup bonus (+3 scans)
✅ Referrer receives confirmation bonus (+5 scans) after first audit
✅ Email notifications sent for rewards
✅ Tracking in `referral_events` for all lifecycle events
✅ Anti-fraud checks: IP/UA/fingerprint + daily invite cap
✅ UI: Referral banner in dashboard + copy to clipboard
✅ Optional: Stripe webhook integration for affiliate credit

### C. Environment-Specific Notes

**Development**:
- Use localhost URLs for testing
- Lower rate limits for easier testing
- Verbose logging enabled

**Staging**:
- Production-like data
- Full anti-fraud enabled
- Test Stripe webhooks with test mode

**Production**:
- All security measures enabled
- Monitoring and alerting active
- Stripe live mode webhooks

---

## Document Version

**Version**: 1.0
**Date**: 2025-01-10
**Author**: Claude Code Design Agent
**Status**: Ready for Implementation

