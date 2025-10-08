/**
 * Fix Subscription Script
 *
 * Manually update user subscription when webhooks fail
 *
 * Usage: npx tsx scripts/fix-subscription.ts <userId> <subscriptionId> <tier>
 * Example: npx tsx scripts/fix-subscription.ts 1 sub_ABC123 pro
 */

// Load environment variables FIRST before any imports
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

async function fixSubscription() {
  // Initialize database connection
  await initDb();

  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error(
      "\n❌ Usage: npx tsx scripts/fix-subscription.ts <userId> <subscriptionId> <tier>"
    );
    console.error(
      "Example: npx tsx scripts/fix-subscription.ts 1 sub_ABC123 pro\n"
    );
    process.exit(1);
  }

  const [userIdStr, subscriptionId, tier] = args;
  const userId = parseInt(userIdStr);

  if (!["free", "pro", "enterprise"].includes(tier)) {
    console.error("\n❌ Invalid tier. Must be: free, pro, or enterprise\n");
    process.exit(1);
  }

  try {
    console.log("\n🔧 Updating subscription...\n");
    console.log(`User ID: ${userId}`);
    console.log(`Subscription ID: ${subscriptionId}`);
    console.log(`Tier: ${tier}`);

    // Update user in database
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        tier: tier as "free" | "pro" | "enterprise",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      console.error("\n❌ User not found\n");
      process.exit(1);
    }

    console.log("\n✅ Subscription updated successfully!\n");
    console.log("Updated user:");
    console.log(`  - Email: ${updatedUser.email}`);
    console.log(`  - Tier: ${updatedUser.tier}`);
    console.log(`  - Subscription ID: ${updatedUser.stripeSubscriptionId}`);
    console.log(`  - Status: ${updatedUser.subscriptionStatus}`);
    console.log("\n🎉 User can now use Pro features!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error updating subscription:", error);
    process.exit(1);
  }
}

fixSubscription();
