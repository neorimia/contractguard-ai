// db/schema.ts
import { pgTable, text, timestamp, integer, jsonb, boolean, serial } from 'drizzle-orm/pg-core';

export const audits = pgTable('audits', {
    id: serial('id').primaryKey(),
    contractAddress: text('contract_address').notNull().unique(),
    chain: text('chain').notNull().default('ethereum'),

    // Contract data
    sourceCode: text('source_code'),
    bytecode: text('bytecode'),
    isVerified: boolean('is_verified').default(false),

    // Analysis results
    riskScore: integer('risk_score'),
    summary: text('summary'),
    issues: jsonb('issues').$type<Issue[]>(),
    recommendation: text('recommendation'), // BUY, AVOID, CAUTION

    // Enrichment data
    holderCount: integer('holder_count'),
    liquidity: text('liquidity'),
    ownerBalance: text('owner_balance'),

    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    views: integer('views').default(0),
    shares: integer('shares').default(0),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),

    // Stack Auth Integration
    stackUserId: text('stack_user_id').notNull().unique(),
    email: text('email').notNull().unique(),

    // Email Verification
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token').unique(),
    verificationTokenExpires: timestamp('verification_token_expires'),

    // Profile (optional, can be pulled from Stack Auth)
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatarUrl: text('avatar_url'),

    // ContractGuard Business Logic
    tier: text('tier').notNull().default('free'), // free, pro, enterprise
    scansToday: integer('scans_today').default(0),
    scansResetAt: timestamp('scans_reset_at').defaultNow(),

    // Billing Integration
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    subscriptionStatus: text('subscription_status'), // active, cancelled, past_due

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
});

export const apiKeys = pgTable('api_keys', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    key: text('key').notNull().unique(),
    name: text('name'),
    requestsCount: integer('requests_count').default(0),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').defaultNow(),
    isActive: boolean('is_active').default(true),
});

// Types
export interface Issue {
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: string;
    description: string;
    impact: string;
    code?: string;
}

export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
