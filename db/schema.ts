// db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  serial,
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

  // Guest User Support
  guestSessionId: text("guest_session_id").unique(), // For anonymous purchases
  isGuest: boolean("is_guest").default(false),

  // Referral System
  referralCode: text("referral_code").unique(), // Format: CG-XXXXXX
  referredBy: text("referred_by"), // Stores referrer's referral_code
  bonusScans: integer("bonus_scans").default(0), // Accumulated bonus scans
  bonusScansUsedToday: integer("bonus_scans_used_today").default(0), // Track daily usage

  // Billing Integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // active, cancelled, past_due

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

// Types
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
