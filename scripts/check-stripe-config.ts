/**
 * Stripe Configuration Checker
 *
 * Verifies all Stripe price IDs are properly configured
 * Run: npx tsx scripts/check-stripe-config.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface ConfigCheck {
  name: string;
  envVar: string;
  value: string | undefined;
  isValid: boolean;
  purpose: string;
}

function checkStripeConfig() {
  console.log("🔍 Checking Stripe Configuration...\n");

  const checks: ConfigCheck[] = [
    {
      name: "Stripe Secret Key",
      envVar: "STRIPE_SECRET_KEY",
      value: process.env.STRIPE_SECRET_KEY,
      isValid:
        !!process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_SECRET_KEY.startsWith("sk_"),
      purpose: "Required for all Stripe operations",
    },
    {
      name: "Stripe Webhook Secret",
      envVar: "STRIPE_WEBHOOK_SECRET",
      value: process.env.STRIPE_WEBHOOK_SECRET,
      isValid:
        !!process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"),
      purpose: "Required for payment webhooks",
    },
    {
      name: "Instant 1 Credit ($4.99)",
      envVar: "STRIPE_PRICE_INSTANT_1",
      value: process.env.STRIPE_PRICE_INSTANT_1,
      isValid:
        !!process.env.STRIPE_PRICE_INSTANT_1 &&
        process.env.STRIPE_PRICE_INSTANT_1.startsWith("price_"),
      purpose: "One-time purchase: 1 scan",
    },
    {
      name: "Instant 3 Credits ($9.99)",
      envVar: "STRIPE_PRICE_INSTANT_3",
      value: process.env.STRIPE_PRICE_INSTANT_3,
      isValid:
        !!process.env.STRIPE_PRICE_INSTANT_3 &&
        process.env.STRIPE_PRICE_INSTANT_3.startsWith("price_"),
      purpose: "One-time purchase: 3 scans (popular)",
    },
    {
      name: "Instant 5 Credits ($14.99)",
      envVar: "STRIPE_PRICE_INSTANT_5",
      value: process.env.STRIPE_PRICE_INSTANT_5,
      isValid:
        !!process.env.STRIPE_PRICE_INSTANT_5 &&
        process.env.STRIPE_PRICE_INSTANT_5.startsWith("price_"),
      purpose: "One-time purchase: 5 scans",
    },
    {
      name: "Pro Monthly ($29/mo)",
      envVar: "STRIPE_PRICE_PRO_MONTHLY",
      value: process.env.STRIPE_PRICE_PRO_MONTHLY,
      isValid:
        !!process.env.STRIPE_PRICE_PRO_MONTHLY &&
        process.env.STRIPE_PRICE_PRO_MONTHLY.startsWith("price_"),
      purpose: "Subscription: Pro plan",
    },
    {
      name: "Team Monthly ($99/mo)",
      envVar: "STRIPE_PRICE_TEAM_MONTHLY",
      value: process.env.STRIPE_PRICE_TEAM_MONTHLY,
      isValid:
        !!process.env.STRIPE_PRICE_TEAM_MONTHLY &&
        process.env.STRIPE_PRICE_TEAM_MONTHLY.startsWith("price_"),
      purpose: "Subscription: Team/API plan",
    },
  ];

  let allValid = true;

  checks.forEach((check) => {
    const status = check.isValid ? "✅" : "❌";
    const displayValue = check.value
      ? check.value.length > 40
        ? check.value.substring(0, 40) + "..."
        : check.value
      : "NOT SET";

    console.log(`${status} ${check.name}`);
    console.log(`   Variable: ${check.envVar}`);
    console.log(`   Value: ${displayValue}`);
    console.log(`   Purpose: ${check.purpose}`);
    console.log();

    if (!check.isValid) {
      allValid = false;
    }
  });

  if (allValid) {
    console.log("✅ All Stripe configuration is valid!");
    console.log("\n🚀 You're ready to process payments.");
  } else {
    console.log("❌ Some Stripe configuration is missing or invalid.");
    console.log("\n📝 Next Steps:");
    console.log("1. Go to https://dashboard.stripe.com/products");
    console.log("2. Create the missing products/prices");
    console.log("3. Copy the Price IDs (start with 'price_')");
    console.log("4. Add them to .env.local");
    console.log("5. Restart your dev server");
  }

  return allValid;
}

// Run the check
const isValid = checkStripeConfig();
process.exit(isValid ? 0 : 1);
