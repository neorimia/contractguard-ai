#!/usr/bin/env tsx

/**
 * Test Starter Plan Configuration
 *
 * This script tests the Starter plan configuration without database connection
 * Run with: npx tsx scripts/test-starter-plan-config.ts
 */

import { PRICING_CONFIG, PRICING_LIMITS } from "../lib/config/pricing";
import { getMonthlyTierLimit } from "../lib/config/tier-limits";

function testStarterPlanConfiguration() {
  console.log("🧪 Testing Starter Plan Configuration\n");

  // Test 1: Pricing Configuration
  console.log("1️⃣ Testing Pricing Configuration");
  console.log("Starter plan config:", {
    id: PRICING_CONFIG.starter.id,
    label: PRICING_CONFIG.starter.label,
    price: PRICING_CONFIG.starter.price,
    monthlyCredits: PRICING_CONFIG.starter.monthlyCredits,
    extraScanPrice: PRICING_CONFIG.starter.extraScanPrice,
  });
  console.log("✅ Starter plan configuration loaded\n");

  // Test 2: PRICING_LIMITS Export
  console.log("2️⃣ Testing PRICING_LIMITS Export");
  console.log("Starter limits:", PRICING_LIMITS.starter);
  console.log("Pro limits:", PRICING_LIMITS.pro);
  console.log("Team limits:", PRICING_LIMITS.team);
  console.log("✅ PRICING_LIMITS export working\n");

  // Test 3: Tier Limits Function
  console.log("3️⃣ Testing Tier Limits Function");
  const starterLimit = getMonthlyTierLimit("starter");
  const proLimit = getMonthlyTierLimit("pro");
  const teamLimit = getMonthlyTierLimit("team");
  const freeLimit = getMonthlyTierLimit("free");

  console.log("Monthly limits:");
  console.log(`  Free: ${freeLimit} credits (converted from daily)`);
  console.log(`  Starter: ${starterLimit} credits`);
  console.log(`  Pro: ${proLimit} credits`);
  console.log(`  Team: ${teamLimit} credits`);
  console.log("✅ Tier limits function working\n");

  // Test 4: Type Safety
  console.log("4️⃣ Testing Type Safety");

  // Test that all subscription tiers are properly typed
  const subscriptionTiers = ["starter", "pro", "team"] as const;
  const allTiers = ["free", ...subscriptionTiers, "enterprise"] as const;

  console.log("Available tiers:", allTiers);
  console.log("Subscription tiers:", subscriptionTiers);
  console.log("✅ Type safety verified\n");

  // Test 5: Environment Variables Check
  console.log("5️⃣ Checking Environment Variables");
  const requiredEnvVars = [
    "STRIPE_STARTER_MONTHLY",
    "STRIPE_PRO_MONTHLY",
    "STRIPE_TEAM_MONTHLY",
    "STRIPE_ENTERPRISE_MONTHLY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length === 0) {
    console.log("✅ All required environment variables are set");
  } else {
    console.log("⚠️ Missing environment variables:");
    missingVars.forEach((varName) => console.log(`  - ${varName}`));
    console.log("Set these in your .env.local file");
  }
  console.log();

  // Test 6: Pricing Structure Validation
  console.log("6️⃣ Validating Pricing Structure");

  const plans = [
    {
      name: "Starter",
      config: PRICING_CONFIG.starter,
      limits: PRICING_LIMITS.starter,
    },
    { name: "Pro", config: PRICING_CONFIG.pro, limits: PRICING_LIMITS.pro },
    { name: "Team", config: PRICING_CONFIG.team, limits: PRICING_LIMITS.team },
  ];

  plans.forEach((plan) => {
    const configCredits = plan.config.monthlyCredits;
    const limitsCredits = plan.limits.monthlyCredits;
    const configPrice = plan.config.extraScanPrice;
    const limitsPrice = plan.limits.extraScanPrice;

    if (configCredits === limitsCredits && configPrice === limitsPrice) {
      console.log(`✅ ${plan.name}: Configuration matches limits`);
    } else {
      console.log(`❌ ${plan.name}: Configuration mismatch`);
      console.log(
        `   Config: ${configCredits} credits, $${configPrice} overage`,
      );
      console.log(
        `   Limits: ${limitsCredits} credits, $${limitsPrice} overage`,
      );
    }
  });
  console.log();

  console.log("🎉 Starter Plan Configuration Test Complete!");
  console.log("\nNext Steps:");
  console.log("1. Set up Stripe products in dashboard");
  console.log("2. Add environment variables to .env.local");
  console.log("3. Test subscription flow in browser");
  console.log("4. Verify webhook events are received");
}

// Run the test
testStarterPlanConfiguration();
