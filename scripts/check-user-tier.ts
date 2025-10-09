/**
 * Check User Tier Script
 *
 * Quickly check a user's current tier and subscription status
 *
 * Usage: npx tsx scripts/check-user-tier.ts <userId>
 * Example: npx tsx scripts/check-user-tier.ts 1
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

// Dynamic imports after env is loaded
let db: any;
let users: any;
let eq: any;

async function initDb() {
  const dbModule = await import("@/db");
  const schemaModule = await import("@/db/schema");
  const drizzleModule = await import("drizzle-orm");
  db = dbModule.db;
  users = schemaModule.users;
  eq = drizzleModule.eq;
}

async function checkUserTier() {
  await initDb();

  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("\n❌ Usage: npx tsx scripts/check-user-tier.ts <userId>");
    console.error("Example: npx tsx scripts/check-user-tier.ts 1\n");
    process.exit(1);
  }

  const userId = parseInt(args[0]);

  try {
    console.log("\n🔍 Checking user tier...\n");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error(`\n❌ User with ID ${userId} not found\n`);
      process.exit(1);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 USER INFORMATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`👤 User ID: ${user.id}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📛 Name: ${user.displayName || "N/A"}`);
    console.log();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💳 SUBSCRIPTION STATUS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const tierEmoji =
      user.tier === "pro" ? "⚡" : user.tier === "enterprise" ? "👑" : "🆓";
    console.log(`${tierEmoji} Tier: ${user.tier.toUpperCase()}`);
    console.log(`🔢 Scans Today: ${user.scansToday}`);
    console.log(`🔄 Reset At: ${user.scansResetAt}`);
    console.log();

    if (user.stripeCustomerId) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💰 STRIPE INFORMATION");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      console.log(`🏦 Customer ID: ${user.stripeCustomerId}`);
      console.log(`📋 Subscription ID: ${user.stripeSubscriptionId || "None"}`);
      console.log(`📊 Status: ${user.subscriptionStatus || "N/A"}`);
      console.log();
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⏰ TIMESTAMPS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log(`📅 Created: ${user.createdAt}`);
    console.log(`🔄 Updated: ${user.updatedAt}`);
    console.log(`🔐 Last Login: ${user.lastLoginAt || "Never"}`);
    console.log();

    // Status check
    if (user.tier === "pro" && user.stripeSubscriptionId) {
      console.log("✅ Status: ACTIVE PRO SUBSCRIPTION\n");
    } else if (user.stripeCustomerId && !user.stripeSubscriptionId) {
      console.log("⚠️  Status: CUSTOMER CREATED BUT SUBSCRIPTION NOT LINKED\n");
      console.log("💡 Action needed:");
      console.log("   1. Check Stripe Dashboard for subscription ID");
      console.log(
        "   2. Run: npx tsx scripts/fix-subscription.ts " +
          user.id +
          " sub_YOUR_ID pro\n"
      );
    } else if (user.tier === "free") {
      console.log("ℹ️  Status: FREE TIER\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error checking user:", error);
    process.exit(1);
  }
}

checkUserTier();
