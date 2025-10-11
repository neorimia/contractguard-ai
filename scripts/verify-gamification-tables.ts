// scripts/verify-gamification-tables.ts
// Quick script to verify gamified referral tables exist

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { sql } from "drizzle-orm";

async function verifyTables() {
  console.log("🔍 Verifying Gamified Referral System Tables...\n");

  try {
    // Check for new tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('referral_commissions', 'referral_tier_achievements', 'social_proof_stats')
      ORDER BY table_name;
    `);

    console.log("📋 New Tables:");
    if (tables.rows.length === 0) {
      console.log("   ❌ No gamification tables found!");
      console.log("\n   Run: npm run db:push");
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }

    // Check for new columns in users table
    const userColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('referral_tier', 'referral_count', 'total_referral_earnings', 'lifetime_commission')
      ORDER BY column_name;
    `);

    console.log("\n📊 New User Table Columns:");
    if (userColumns.rows.length === 0) {
      console.log("   ❌ No new columns found in users table!");
    } else {
      userColumns.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.column_name} (${row.data_type})`);
      });
    }

    // Check for indexes
    const indexes = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('referral_commissions', 'referral_tier_achievements', 'social_proof_stats', 'users')
      AND indexname LIKE '%referral%'
      ORDER BY indexname;
    `);

    console.log("\n🔗 Referral-Related Indexes:");
    if (indexes.rows.length === 0) {
      console.log(
        "   ⚠️  No referral indexes found (may need manual creation)"
      );
    } else {
      indexes.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.indexname}`);
      });
    }

    console.log("\n✅ Verification Complete!");
    console.log("\nNext steps:");
    console.log("1. Visit http://localhost:5555 to view Drizzle Studio");
    console.log("2. Test the API endpoints:");
    console.log("   - GET /api/referrals/leaderboard");
    console.log("   - GET /api/referrals/social-proof");
    console.log(
      "3. Add components to your pages (see GAMIFIED_REFERRAL_SETUP.md)"
    );
  } catch (error) {
    console.error("❌ Error verifying tables:", error);
    process.exit(1);
  }

  process.exit(0);
}

verifyTables();
