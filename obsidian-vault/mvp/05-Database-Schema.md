# Database Schema - Drizzle ORM

Complete database schema for ContractGuard AI using Drizzle ORM with Neon PostgreSQL.

---

## Full Schema Code

Create `db/schema.ts`:

```typescript
// db/schema.ts
import { pgTable, text, timestamp, integer, jsonb, boolean, serial } from 'drizzle-orm/pg-core';

// Main audits table - stores contract analysis results
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

// Users table - for authentication and tier management
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  tier: text('tier').notNull().default('free'), // free, pro, enterprise
  scansToday: integer('scans_today').default(0),
  scansResetAt: timestamp('scans_reset_at').defaultNow(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// API keys table - for developers
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

// TypeScript interfaces
export interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  impact: string;
  code?: string;
}

// Type inference for TypeScript
export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
```

---

## Table Breakdown

### `audits` Table

**Purpose:** Store all contract analysis results

| Column | Type | Purpose |
|--------|------|---------|
| `id` | serial | Primary key |
| `contractAddress` | text | Contract address (unique) |
| `chain` | text | Blockchain (ethereum, bsc, etc.) |
| `sourceCode` | text | Contract source code (partial) |
| `bytecode` | text | Contract bytecode |
| `isVerified` | boolean | Is contract verified? |
| `riskScore` | integer | 0-100 risk score |
| `summary` | text | AI-generated summary |
| `issues` | jsonb | Array of detected issues |
| `recommendation` | text | BUY/CAUTION/AVOID |
| `holderCount` | integer | Number of holders |
| `liquidity` | text | Liquidity amount |
| `ownerBalance` | text | Owner's token balance |
| `views` | integer | View count |
| `shares` | integer | Share count |
| `createdAt` | timestamp | Created timestamp |
| `updatedAt` | timestamp | Updated timestamp |

**Indexes:**
- Unique on `contractAddress`
- Index on `chain` for filtering
- Index on `createdAt` for sorting

---

### `users` Table

**Purpose:** User authentication and subscription management

| Column | Type | Purpose |
|--------|------|---------|
| `id` | serial | Primary key |
| `email` | text | User email (unique) |
| `tier` | text | Subscription tier |
| `scansToday` | integer | Daily scan counter |
| `scansResetAt` | timestamp | When to reset counter |
| `stripeCustomerId` | text | Stripe customer ID |
| `createdAt` | timestamp | Registration date |

**Tiers:**
- `free`: 3 scans/day
- `pro`: Unlimited scans
- `enterprise`: Custom features

---

### `api_keys` Table

**Purpose:** API access for developers

| Column | Type | Purpose |
|--------|------|---------|
| `id` | serial | Primary key |
| `userId` | integer | Foreign key to users |
| `key` | text | API key (unique) |
| `name` | text | Key name/description |
| `requestsCount` | integer | Total requests |
| `lastUsedAt` | timestamp | Last usage |
| `isActive` | boolean | Is key active? |
| `createdAt` | timestamp | Creation date |

---

## Usage Examples

### Query Recent Audits

```typescript
import { db } from '@/db';
import { audits } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// Get recent audits
const recent = await db
  .select()
  .from(audits)
  .orderBy(desc(audits.createdAt))
  .limit(10);

// Find specific audit
const audit = await db.query.audits.findFirst({
  where: eq(audits.contractAddress, '0x...')
});
```

### Create New Audit

```typescript
import { db } from '@/db';
import { audits, NewAudit } from '@/db/schema';

const newAudit: NewAudit = {
  contractAddress: '0x...',
  chain: 'ethereum',
  isVerified: true,
  riskScore: 85,
  summary: 'High risk contract...',
  issues: [
    {
      severity: 'CRITICAL',
      type: 'Honeypot',
      description: 'Only owner can sell',
      impact: 'Users cannot sell tokens'
    }
  ],
  recommendation: 'AVOID',
  holderCount: 150,
  liquidity: '$5000',
  ownerBalance: '50%'
};

await db.insert(audits).values(newAudit);
```

### Update Audit Stats

```typescript
import { db } from '@/db';
import { audits } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Increment view count
await db
  .update(audits)
  .set({ 
    views: sql`${audits.views} + 1`,
    updatedAt: new Date()
  })
  .where(eq(audits.contractAddress, '0x...'));
```

### User Management

```typescript
import { db } from '@/db';
import { users, NewUser } from '@/db/schema';

// Create new user
const newUser: NewUser = {
  email: 'user@example.com',
  tier: 'free',
  scansToday: 0,
  scansResetAt: new Date()
};

await db.insert(users).values(newUser);

// Check scan limit
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com')
});

if (user.tier === 'free' && user.scansToday >= 3) {
  // Rate limit exceeded
}
```

---

## Migrations

### Initial Migration

```bash
# Generate migration
npm run db:generate

# Push to database
npm run db:push
```

### Future Schema Changes

```bash
# 1. Modify schema.ts
# 2. Generate migration
npm run db:generate

# 3. Review migration in drizzle/ folder
# 4. Apply migration
npm run db:push
```

---

## Database Connection

Create `db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## Caching Strategy

### Redis Cache Layer

```typescript
// Cache key format
const cacheKey = `audit:${chain}:${address}`;

// Cache TTL
const CACHE_TTL = 300; // 5 minutes

// Database TTL
const DB_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

**Flow:**
1. Check Redis (5 min cache)
2. Check Database (24 hour cache)
3. Fetch fresh if needed
4. Update both caches

---

## Data Retention

### Audit Results
- Keep forever (valuable historical data)
- Archive old entries to cold storage after 1 year
- Compress `sourceCode` field

### User Data
- Keep active users forever
- Delete inactive after 2 years (GDPR)
- Anonymize deleted user data

### API Keys
- Deactivate unused keys after 6 months
- Delete after 1 year of inactivity

---

## Performance Optimization

### Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_audits_chain ON audits(chain);
CREATE INDEX idx_audits_created ON audits(created_at DESC);
CREATE INDEX idx_audits_risk ON audits(risk_score DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_api_keys_key ON api_keys(key);
```

### Partitioning

For scale (1M+ audits):

```sql
-- Partition by chain
CREATE TABLE audits_ethereum PARTITION OF audits 
FOR VALUES IN ('ethereum');

CREATE TABLE audits_bsc PARTITION OF audits 
FOR VALUES IN ('bsc');
```

---

## Backup Strategy

### Automated Backups
- Neon provides automatic daily backups
- Keep 7-day rolling backups
- Manual backup before major migrations

### Export Data

```typescript
// Export audits to JSON
const allAudits = await db.select().from(audits);
fs.writeFileSync('backup.json', JSON.stringify(allAudits, null, 2));
```

---

## Related Notes

- [[06-API-Services]] - How services use this schema
- [[23-Audit-API]] - API implementation
- [[04-Quick-Start]] - Setup instructions
- [[33-Troubleshooting]] - Database issues

---

#database #schema #drizzle #postgresql
