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
    email: text('email').notNull().unique(),
    tier: text('tier').notNull().default('free'), // free, pro, enterprise
    scansToday: integer('scans_today').default(0),
    scansResetAt: timestamp('scans_reset_at').defaultNow(),
    stripeCustomerId: text('stripe_customer_id'),
    createdAt: timestamp('created_at').defaultNow(),
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
