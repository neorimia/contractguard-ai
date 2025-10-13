# Fix Database Schema - topHolderConcentration Type Error

## 🐛 Issue

**Error**: `invalid input syntax for type integer: "95.72"`

**Cause**: The `top_holder_concentration` column is defined as `integer` but receives decimal values like `95.72%`

## ✅ Solution

The migration has been generated. Apply it to your database:

### Option 1: Neon Dashboard (Recommended - 1 minute)

1. Go to https://console.neon.tech
2. Open SQL Editor for your database
3. Run this SQL:

```sql
ALTER TABLE "crypto_audits" ALTER COLUMN "top_holder_concentration" SET DATA TYPE numeric;
```

4. Done! ✅

### Option 2: Drizzle Studio (if table doesn't exist)

If the `crypto_audits` table doesn't exist yet, run BOTH migrations:

```sql
-- First create the table (migration 0007)
CREATE TABLE "crypto_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_address" varchar(255) NOT NULL,
	"chain" varchar(50) NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_category" varchar(50),
	"flags" jsonb,
	"metadata" jsonb,
	"confidence" integer DEFAULT 0,
	"holder_count" integer,
	"top_holder_concentration" numeric,
	"liquidity_usd" numeric,
	"is_verified" boolean DEFAULT false,
	"views" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);

CREATE UNIQUE INDEX "contract_chain_idx" ON "crypto_audits" USING btree ("contract_address","chain");
CREATE INDEX "risk_score_idx" ON "crypto_audits" USING btree ("risk_score");

-- Then create risk_heuristics table
CREATE TABLE "risk_heuristics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"weight" integer DEFAULT 10,
	"threshold" jsonb,
	"enabled" boolean DEFAULT true,
	"description" text,
	"rule" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "risk_heuristics_name_unique" UNIQUE("name")
);
```

## 🧪 Test After Fix

Run this to verify it works:

```bash
npm run dev
```

Then scan any contract - the error should be gone! 🎉

---

## 📋 Migration Files

- **0007_deep_wiccan.sql** - Creates crypto_audits table (integer type - OLD)
- **0008_flat_micromacro.sql** - Fixes top_holder_concentration to numeric (NEW) ✅

## 🔍 What Changed

**Before**:

```typescript
topHolderConcentration: integer("top_holder_concentration"); // ❌ Can't store 95.72
```

**After**:

```typescript
topHolderConcentration: numeric("top_holder_concentration"); // ✅ Stores 95.72
```

---

**Status**: Ready to apply! Just run the SQL in Neon Dashboard.
