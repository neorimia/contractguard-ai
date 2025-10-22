#!/usr/bin/env tsx

/**
 * Test User Tracking Functionality
 *
 * This script tests the new user tracking functionality with crypto_audits table
 * Run with: npx tsx scripts/test-user-tracking.ts
 */

import { db } from "../db";
import { cryptoAudits, users } from "../db/schema";
import { canScan, getUserUsage } from "../lib/usage/checkCredits";
import { PRICING_LIMITS } from "../lib/config/pricing";

async function testUserTracking() {
  console.log("🧪 Testing User Tracking Functionality\n");

  try {
    // Test 1: Check if user_id column exists
    console.log("1️⃣ Checking crypto_audits table structure");

    const tableInfo = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'crypto_audits'
        AND column_name = 'user_id'
    `);

    if (tableInfo.rows.length > 0) {
      console.log("✅ user_id column exists in crypto_audits table");
      console.log("   Column info:", tableInfo.rows[0]);
    } else {
      console.log("❌ user_id column not found in crypto_audits table");
      return;
    }
    console.log();

    // Test 2: Check indexes
    console.log("2️⃣ Checking indexes");

    const indexes = await db.execute(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'crypto_audits'
        AND indexname LIKE '%user%'
    `);

    console.log("User-related indexes:");
    indexes.rows.forEach((idx: any) => {
      console.log(`  - ${idx.indexname}`);
    });
    console.log();

    // Test 3: Test usage tracking functions
    console.log("3️⃣ Testing usage tracking functions");

    // Create a test user (if not exists)
    const testUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "test@contractguard.ai"),
    });

    if (!testUser) {
      console.log(
        "⚠️ No test user found. Create a user first to test tracking."
      );
      console.log("   You can create one by signing up on the website.");
      return;
    }

    console.log(`✅ Found test user: ${testUser.email} (ID: ${testUser.id})`);

    // Test canScan function
    const canScanResult = await canScan(testUser);
    console.log("canScan result:", canScanResult);

    // Test getUserUsage function
    const usageResult = await getUserUsage(testUser.id, testUser.tier as any);
    console.log("getUserUsage result:", usageResult);
    console.log();

    // Test 4: Check existing audit records
    console.log("4️⃣ Checking existing audit records");

    const auditCount = await db.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(user_id) as with_user_id,
        COUNT(*) - COUNT(user_id) as without_user_id
      FROM crypto_audits
    `);

    const counts = auditCount.rows[0] as any;
    console.log(`Total audits: ${counts.total}`);
    console.log(`With user_id: ${counts.with_user_id}`);
    console.log(`Without user_id: ${counts.without_user_id}`);
    console.log();

    // Test 5: Test monthly usage calculation
    console.log("5️⃣ Testing monthly usage calculation");

    const currentMonth = new Date();
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const monthlyUsage = await db.execute(`
      SELECT COUNT(*)::int AS used
      FROM crypto_audits
      WHERE user_id = ${testUser.id}
        AND created_at >= '${monthStart.toISOString()}'
    `);

    const used = Number(monthlyUsage.rows[0]?.used) || 0;
    console.log(`User ${testUser.id} has used ${used} scans this month`);

    if (testUser.tier === "starter") {
      const limits = PRICING_LIMITS.starter;
      const remaining = Math.max(0, limits.monthlyCredits - used);
      console.log(
        `Starter plan: ${used}/${limits.monthlyCredits} used, ${remaining} remaining`
      );
    } else if (testUser.tier === "pro") {
      const limits = PRICING_LIMITS.pro;
      const remaining = Math.max(0, limits.monthlyCredits - used);
      console.log(
        `Pro plan: ${used}/${limits.monthlyCredits} used, ${remaining} remaining`
      );
    } else if (testUser.tier === "team") {
      const limits = PRICING_LIMITS.team;
      const remaining = Math.max(0, limits.monthlyCredits - used);
      console.log(
        `Team plan: ${used}/${limits.monthlyCredits} used, ${remaining} remaining`
      );
    }
    console.log();

    console.log("🎉 User Tracking Test Complete!");
    console.log("\nNext Steps:");
    console.log("1. Test actual audit creation with user_id");
    console.log("2. Verify monthly limits are enforced");
    console.log("3. Test overage pricing functionality");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testUserTracking().catch(console.error);
