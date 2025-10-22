// db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  serial,
  varchar,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  chain: text("chain").notNull().default("ethereum"),

  // Contract data
  sourceCode: text("source_code"),
  bytecode: text("bytecode"),
  isVerified: boolean("is_verified").default(false),

  // Analysis results
  riskScore: integer("risk_score"),
  summary: text("summary"),
  issues: jsonb("issues").$type<Issue[]>(),
  recommendation: text("recommendation"), // BUY, AVOID, CAUTION

  // Enrichment data
  holderCount: integer("holder_count"),
  liquidity: text("liquidity"),
  ownerBalance: text("owner_balance"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  views: integer("views").default(0),
  shares: integer("shares").default(0),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  // Stack Auth Integration
  stackUserId: text("stack_user_id").notNull().unique(),
  email: text("email").notNull().unique(),

  // Email Verification
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token").unique(),
  verificationTokenExpires: timestamp("verification_token_expires"),

  // Profile (optional, can be pulled from Stack Auth)
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),

  // ContractGuard Business Logic
  tier: text("tier").notNull().default("free"), // free, pro, enterprise
  scansToday: integer("scans_today").default(0),
  scansResetAt: timestamp("scans_reset_at").defaultNow(),

  // Instant Credits System
  instantCredits: integer("instant_credits").default(0), // Pay-per-scan credits
  instantCreditsUsedToday: integer("instant_credits_used_today").default(0),

  // Anonymous & Progressive Signup Support
  anonymousSessionId: text("anonymous_session_id").unique(), // For anonymous scans
  softSignupEmail: text("soft_signup_email"), // Email-only registration
  accountType: text("account_type").default("full"), // anonymous | soft | full

  // Guest User Support (for purchases)
  guestSessionId: text("guest_session_id").unique(), // For anonymous purchases
  isGuest: boolean("is_guest").default(false),

  // Referral System
  referralCode: text("referral_code").unique(), // Format: CG-XXXXXX
  referredBy: text("referred_by"), // Stores referrer's referral_code
  bonusScans: integer("bonus_scans").default(0), // Accumulated bonus scans
  bonusScansUsedToday: integer("bonus_scans_used_today").default(0), // Track daily usage

  // Referral Gamification
  referralTier: text("referral_tier").default("none"), // none, bronze, iron, silver, gold, platinum, ambassador
  referralCount: integer("referral_count").default(0), // Total confirmed referrals
  paidReferrals: integer("paid_referrals").default(0), // Total paying referrals
  referredRevenue: integer("referred_revenue").default(0), // Total revenue from referred users (in cents)
  totalReferralEarnings: integer("total_referral_earnings").default(0), // Total earned from referrals (in cents)
  lifetimeCommission: integer("lifetime_commission").default(0), // Total recurring commission earned (in cents)
  lastReferralRewardAt: timestamp("last_referral_reward_at"), // Last reward claim timestamp for cooldown

  // Billing Integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // active, cancelled, past_due

  // Email Alert Preferences
  alertsEnabled: boolean("alerts_enabled").default(true),
  alertEmail: text("alert_email"), // Optional: different email for alerts
  maxAlertsPerDay: integer("max_alerts_per_day").default(10), // Rate limiting
  lastAlertSent: timestamp("last_alert_sent", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  key: text("key").notNull().unique(),
  name: text("name"),
  requestsCount: integer("requests_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  reason: text("reason"), // cancellation, feature, bug, general
  feedback: text("feedback").notNull(),
  rating: integer("rating"), // 1-5 stars
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral Tables
export const referrals = pgTable("referrals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationship
  referrerId: integer("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredId: integer("referred_id").references(() => users.id, {
    onDelete: "set null",
  }),

  // Status Tracking
  status: text("status", {
    enum: ["pending", "confirmed", "rewarded", "cancelled"],
  })
    .notNull()
    .default("pending"),

  // Reward Configuration
  rewardType: text("reward_type", {
    enum: ["scans", "trial", "discount", "credit"],
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
    confirmTrigger?: string;
    source?: string;
  }>(),
});

export const referralEvents = pgTable("referral_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationship
  referralId: text("referral_id")
    .notNull()
    .references(() => referrals.id, { onDelete: "cascade" }),

  // Event Type
  event: text("event", {
    enum: [
      "landing",
      "signup",
      "first_audit",
      "email_verified",
      "paid",
      "payout",
    ],
  }).notNull(),

  // Anti-Fraud Data
  ip: text("ip"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"),
  deviceType: text("device_type"),

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

export const rewardsLedger = pgTable("rewards_ledger", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationship
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referralId: text("referral_id").references(() => referrals.id, {
    onDelete: "set null",
  }),

  // Reward Details
  type: text("type", {
    enum: ["scans", "trial", "discount", "credit", "pro_month"],
  }).notNull(),
  amount: integer("amount").notNull(),

  // Status
  status: text("status", {
    enum: ["pending", "applied", "expired", "revoked"],
  })
    .notNull()
    .default("pending"),

  // Application Tracking
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  // Metadata
  metadata: jsonb("metadata").$type<{
    description?: string;
    stripeInvoiceId?: string;
    stripeBalanceTxnId?: string;
    promoCode?: string;
    revokeReason?: string;
    revokedAt?: string;
  }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Purchases table for one-time and subscription transactions
export const purchases = pgTable("purchases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // User relationship (nullable for guest purchases)
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  guestSessionId: text("guest_session_id"), // For anonymous purchases
  guestEmail: text("guest_email"), // For receipt delivery

  // Purchase details
  type: text("type", {
    enum: ["instant_credits", "pro_subscription", "team_subscription"],
  }).notNull(),
  credits: integer("credits"), // For instant credits purchases
  amount: integer("amount").notNull(), // In cents
  currency: text("currency").notNull().default("usd"),

  // Stripe references
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // Status tracking
  status: text("status", {
    enum: ["pending", "completed", "failed", "refunded"],
  })
    .notNull()
    .default("pending"),

  // Metadata
  metadata: jsonb("metadata").$type<{
    packageSize?: number;
    ipAddress?: string;
    userAgent?: string;
    referralCode?: string;
    contractAddress?: string;
  }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// Anonymous Scans table for temporary storage
export const anonymousScans = pgTable("anonymous_scans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  sessionId: text("session_id").notNull(), // Anonymous session UUID
  contractAddress: text("contract_address").notNull(),
  chain: text("chain").notNull().default("ethereum"),

  // Analysis results (same as audits table)
  riskScore: integer("risk_score"),
  summary: text("summary"),
  issues: jsonb("issues").$type<Issue[]>(),
  recommendation: text("recommendation"), // BUY, AVOID, CAUTION

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 24 hours from creation
});

// Banner Monetization Tables
export const banners = pgTable("banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Banner Identity
  name: text("name").notNull(),
  type: text("type", {
    enum: [
      "internal_upgrade",
      "partner_ad",
      "feature_education",
      "social_proof",
      "urgency",
    ],
  }).notNull(),
  category: text("category", {
    enum: ["upgrade", "educational", "winback", "paywall", "partnership"],
  }).notNull(),

  // Placement Configuration
  placement: text("placement", {
    enum: [
      "top_leaderboard",
      "sidebar_rectangle",
      "bottom_sticky",
      "inline_result",
      "modal_overlay",
    ],
  }).notNull(),
  priority: integer("priority").notNull().default(5),

  // Targeting Rules
  targetUserType: text("target_user_type", {
    enum: ["anonymous", "soft", "free", "power_user", "churned", "all"],
  }).notNull(),
  minScans: integer("min_scans").default(0),
  maxScans: integer("max_scans"),
  targetTier: text("target_tier", {
    enum: ["free", "pro", "enterprise", "all"],
  }).default("all"),

  // Content
  headline: text("headline").notNull(),
  body: text("body"),
  ctaText: text("cta_text").notNull(),
  ctaUrl: text("cta_url").notNull(),

  // Design Specifications
  format: text("format", {
    enum: ["static", "animated", "html5", "video"],
  })
    .notNull()
    .default("static"),
  backgroundColor: text("background_color").default("#1F2937"),
  textColor: text("text_color").default("#FFFFFF"),
  assetUrl: text("asset_url"),
  customCss: text("custom_css"),

  // A/B Testing
  variantGroup: text("variant_group"),
  variantName: text("variant_name"),

  // External Partner Configuration
  isExternal: boolean("is_external").default(false),
  partnerName: text("partner_name"),
  partnerScriptUrl: text("partner_script_url"),
  partnerAdUnitId: text("partner_ad_unit_id"),
  cpmRate: integer("cpm_rate"),

  // Status & Scheduling
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),

  // Performance Tracking
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: integer("revenue").default(0),

  // Metadata
  metadata: jsonb("metadata").$type<{
    frequencyCap?: number;
    showAfterScan?: number;
    dismissible?: boolean;
    requiresConsent?: boolean;
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
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  sessionId: text("session_id").notNull(),

  // Context
  contractAddress: text("contract_address"),
  scanCount: integer("scan_count"),
  userTier: text("user_tier"),
  placement: text("placement").notNull(),

  // Interaction
  wasClicked: boolean("was_clicked").default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  converted: boolean("converted").default(false),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  revenueGenerated: integer("revenue_generated").default(0),

  // Technical Metadata
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  deviceType: text("device_type", {
    enum: ["desktop", "mobile", "tablet"],
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
    enum: ["hourly", "daily", "weekly", "monthly"],
  }).notNull(),

  // Core Metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  ctr: integer("ctr").default(0),
  conversionRate: integer("conversion_rate").default(0),
  revenue: integer("revenue").default(0),
  revenuePerImpression: integer("revenue_per_impression").default(0),

  // Segmentation
  userType: text("user_type"),
  placement: text("placement"),
  deviceType: text("device_type"),

  // Quality Metrics
  averageTimeToClick: integer("average_time_to_click"),
  bounceRate: integer("bounce_rate"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Referral Commissions table for 10% recurring rewards
export const referralCommissions = pgTable("referral_commissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  referrerId: integer("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Commission Details
  subscriptionTier: text("subscription_tier", {
    enum: ["pro", "team"],
  }).notNull(),
  monthlyCommission: integer("monthly_commission").notNull(), // 10% in cents
  totalEarned: integer("total_earned").default(0), // Lifetime total in cents

  // Status Tracking
  status: text("status", {
    enum: ["active", "paused", "ended"],
  })
    .notNull()
    .default("active"),

  // Payout Management
  nextPayoutDate: timestamp("next_payout_date", { withTimezone: true }),
  lastPayoutDate: timestamp("last_payout_date", { withTimezone: true }),

  // Stripe Integration
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Metadata
  metadata: jsonb("metadata").$type<{
    payoutHistory?: Array<{
      date: string;
      amount: number;
      stripeTransferId?: string;
    }>;
    notes?: string;
  }>(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Referral Tier Achievements for gamification
export const referralTierAchievements = pgTable("referral_tier_achievements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationship
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Tier Information
  tier: text("tier", {
    enum: ["bronze", "iron", "silver", "gold", "platinum", "ambassador"],
  }).notNull(),
  referralsRequired: integer("referrals_required").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardDescription: text("reward_description").notNull(),

  // Achievement Tracking
  achievedAt: timestamp("achieved_at", { withTimezone: true }).defaultNow(),

  // Metadata
  metadata: jsonb("metadata").$type<{
    badge?: string;
    announcement?: string;
    specialPerks?: string[];
  }>(),
});

// Reward Audit Log for tracking reward decisions and ROI validation
export const referralRewards = pgTable("referral_rewards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Relationships
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").references(
    () => referralTierAchievements.id,
    { onDelete: "set null" }
  ),

  // Tier Information
  tier: text("tier", {
    enum: ["bronze", "iron", "silver", "gold", "platinum", "ambassador"],
  }).notNull(),
  rewardType: text("reward_type", {
    enum: ["trial", "subscription", "lifetime", "commission"],
  }).notNull(),

  // Reward Decision
  status: text("status", {
    enum: ["granted", "denied", "pending"],
  })
    .notNull()
    .default("pending"),
  denialReason: text("denial_reason"),

  // Financial Tracking
  rewardValue: integer("reward_value").notNull(), // Reward cost in cents
  revenueAtTime: integer("revenue_at_time").default(0), // User's referred revenue at time of decision (cents)
  roiRatio: integer("roi_ratio"), // ROI ratio × 100 (e.g., 500 = 5.0×)

  // Referral Context
  totalReferrals: integer("total_referrals").notNull(),
  paidReferrals: integer("paid_referrals").notNull(),

  // Cooldown Information
  wasInCooldown: boolean("was_in_cooldown").default(false),
  cooldownDaysRemaining: integer("cooldown_days_remaining"),

  // Timestamps
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),

  // Metadata
  metadata: jsonb("metadata").$type<{
    rewardDetails?: string;
    scanCredits?: number;
    commissionRate?: number;
    validationChecks?: {
      cooldown: boolean;
      tierUnlocked: boolean;
      roiProfitable: boolean | null;
    };
    notes?: string;
  }>(),
});

// Social Proof Stats for viral marketing
export const socialProofStats = pgTable("social_proof_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Time Period
  date: timestamp("date", { withTimezone: true }).notNull(),
  period: text("period", {
    enum: ["daily", "weekly", "monthly", "all_time"],
  }).notNull(),

  // Viral Metrics
  totalUsersJoined: integer("total_users_joined").default(0),
  totalScamsAvoided: integer("total_scams_avoided").default(0),
  estimatedSavingsUsd: integer("estimated_savings_usd").default(0), // in cents
  totalReferrals: integer("total_referrals").default(0),
  topReferrerCount: integer("top_referrer_count").default(0),

  // Metadata
  metadata: jsonb("metadata").$type<{
    topSavings?: Array<{
      userId: number;
      amount: number;
      percentage: number;
    }>;
    viralCoefficient?: number;
    growthRate?: number;
  }>(),

  // Timestamp
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// CRYPTOGUARD TABLES - Smart Contract Security Analysis Module
// ============================================================================

// CryptoGuard Audits - Smart contract risk analysis results
export const cryptoAudits = pgTable(
  "crypto_audits",
  {
    id: serial("id").primaryKey(),
    contractAddress: varchar("contract_address", { length: 255 }).notNull(),
    chain: varchar("chain", { length: 50 }).notNull(), // 'ethereum', 'bsc', 'solana'
    riskScore: integer("risk_score").notNull(), // 0-100
    riskCategory: varchar("risk_category", { length: 50 }), // 'very_low', 'low', 'medium', 'high', 'critical'

    // Analysis results
    flags: jsonb("flags").$type<RiskFlag[]>(), // Array of red flags
    metadata: jsonb("metadata").$type<ContractMetadata>(),
    confidence: integer("confidence").default(0), // 0-100

    // Enrichment data
    holderCount: integer("holder_count"),
    topHolderConcentration: numeric("top_holder_concentration"), // % (decimal precision)
    liquidityUsd: numeric("liquidity_usd"),
    isVerified: boolean("is_verified").default(false),

    // Tracking
    views: integer("views").default(0),
    shares: integer("shares").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"), // Cache TTL (24 hours)
  },
  (table) => ({
    contractIdx: uniqueIndex("contract_chain_idx").on(
      table.contractAddress,
      table.chain
    ),
    riskScoreIdx: index("risk_score_idx").on(table.riskScore),
  })
);

// Risk Heuristics - Configurable risk detection rules
export const riskHeuristics = pgTable("risk_heuristics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(), // 'code', 'liquidity', 'tokenomics', 'transparency'
  weight: integer("weight").default(10), // 1-100
  threshold: jsonb("threshold"), // Custom threshold config
  enabled: boolean("enabled").default(true),
  description: text("description"),
  rule: jsonb("rule").$type<HeuristicRule>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CryptoGuard Type Definitions
export interface RiskFlag {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string;
  confidence: number;
}

export interface ContractMetadata {
  deployer: string;
  deployDate: string;
  sourceCode?: string;
  compiler?: string;
  txCount?: number;
  socialLinks?: {
    github?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export interface HeuristicRule {
  type: string;
  parameters: Record<string, any>;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

// ============================================================================
// LEGACY TYPES
// ============================================================================

export interface Issue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  description: string;
  impact: string;
  code?: string;
}

export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type NewReferralEvent = typeof referralEvents.$inferInsert;
export type RewardLedger = typeof rewardsLedger.$inferSelect;
export type NewRewardLedger = typeof rewardsLedger.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type AnonymousScan = typeof anonymousScans.$inferSelect;
export type NewAnonymousScan = typeof anonymousScans.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
export type BannerImpression = typeof bannerImpressions.$inferSelect;
export type NewBannerImpression = typeof bannerImpressions.$inferInsert;
export type BannerAnalytics = typeof bannerAnalytics.$inferSelect;
export type NewBannerAnalytics = typeof bannerAnalytics.$inferInsert;
export type ReferralCommission = typeof referralCommissions.$inferSelect;
export type NewReferralCommission = typeof referralCommissions.$inferInsert;
export type ReferralTierAchievement =
  typeof referralTierAchievements.$inferSelect;
export type NewReferralTierAchievement =
  typeof referralTierAchievements.$inferInsert;
export type ReferralReward = typeof referralRewards.$inferSelect;
export type NewReferralReward = typeof referralRewards.$inferInsert;
export type SocialProofStat = typeof socialProofStats.$inferSelect;
export type NewSocialProofStat = typeof socialProofStats.$inferInsert;

// Instant reports table removed - using instant credits system instead

// CryptoGuard Type Exports
export type CryptoAudit = typeof cryptoAudits.$inferSelect;
export type NewCryptoAudit = typeof cryptoAudits.$inferInsert;
export type RiskHeuristic = typeof riskHeuristics.$inferSelect;
export type NewRiskHeuristic = typeof riskHeuristics.$inferInsert;
// Instant report types removed - using instant credits system instead

// ============================================================================
// EMAIL ALERTS & WATCHLIST TABLES - Contract monitoring system
// ============================================================================

// Watchlists - User contract watchlist with alert preferences
export const watchlists = pgTable(
  "watchlists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Relationships
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contractAddress: text("contract_address").notNull(),
    chain: text("chain").notNull().default("ethereum"),

    // Alert Configuration
    alertEnabled: boolean("alert_enabled").default(true),
    alertFrequency: text("alert_frequency", {
      enum: ["instant", "hourly", "daily"],
    })
      .notNull()
      .default("instant"),

    // Alert Triggers
    alertOnRiskIncrease: boolean("alert_on_risk_increase").default(true),
    alertOnNewFlags: boolean("alert_on_new_flags").default(true),
    alertOnLiquidityChange: boolean("alert_on_liquidity_change").default(false),
    alertOnHolderChange: boolean("alert_on_holder_change").default(false),

    // Thresholds
    riskIncreaseThreshold: integer("risk_increase_threshold").default(10), // +10 points
    liquidityChangeThreshold: integer("liquidity_change_threshold").default(20), // 20% change
    holderChangeThreshold: integer("holder_change_threshold").default(15), // 15% change

    // Metadata
    nickname: text("nickname"), // User-defined name for contract
    notes: text("notes"), // Private notes
    lastAlertSent: timestamp("last_alert_sent", { withTimezone: true }),
    lastChecked: timestamp("last_checked", { withTimezone: true }),

    // Tracking
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userContractIdx: uniqueIndex("user_contract_idx").on(
      table.userId,
      table.contractAddress,
      table.chain
    ),
    userIdIdx: index("watchlist_user_id_idx").on(table.userId),
    alertEnabledIdx: index("watchlist_alert_enabled_idx").on(
      table.alertEnabled
    ),
  })
);

// Watchlist Snapshots - Historical snapshots for change detection
export const watchlistSnapshots = pgTable(
  "watchlist_snapshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Relationships
    watchlistId: text("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),

    // Snapshot Data (from cryptoAudits table)
    riskScore: integer("risk_score").notNull(),
    riskCategory: text("risk_category"),
    flagCount: integer("flag_count").notNull(),
    flags: jsonb("flags").$type<RiskFlag[]>(),

    // Enrichment Data
    holderCount: integer("holder_count"),
    liquidityUsd: numeric("liquidity_usd"),
    topHolderConcentration: numeric("top_holder_concentration"),

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    watchlistIdIdx: index("snapshot_watchlist_id_idx").on(table.watchlistId),
    createdAtIdx: index("snapshot_created_at_idx").on(table.createdAt),
  })
);

// Alert History - Track all alerts sent to users
export const alertHistory = pgTable(
  "alert_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Relationships
    watchlistId: text("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Alert Details
    alertType: text("alert_type", {
      enum: [
        "risk_increase",
        "new_flags",
        "liquidity_change",
        "holder_change",
        "critical_alert",
      ],
    }).notNull(),
    severity: text("severity", {
      enum: ["low", "medium", "high", "critical"],
    }).notNull(),

    // Change Data
    previousValue: jsonb("previous_value"),
    currentValue: jsonb("current_value"),
    changePercentage: numeric("change_percentage"),

    // Email Delivery
    emailSent: boolean("email_sent").default(false),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailError: text("email_error"),

    // User Interaction
    opened: boolean("opened").default(false),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clicked: boolean("clicked").default(false),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").$type<{
      contractAddress?: string;
      chain?: string;
      riskScoreChange?: number;
      newFlags?: RiskFlag[];
      triggerReason?: string;
    }>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    watchlistIdIdx: index("alert_watchlist_id_idx").on(table.watchlistId),
    userIdIdx: index("alert_user_id_idx").on(table.userId),
    createdAtIdx: index("alert_created_at_idx").on(table.createdAt),
    emailSentIdx: index("alert_email_sent_idx").on(table.emailSent),
  })
);

// Type Exports for Watchlist System
export type Watchlist = typeof watchlists.$inferSelect;
export type NewWatchlist = typeof watchlists.$inferInsert;
export type WatchlistSnapshot = typeof watchlistSnapshots.$inferSelect;
export type NewWatchlistSnapshot = typeof watchlistSnapshots.$inferInsert;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type NewAlertHistory = typeof alertHistory.$inferInsert;
