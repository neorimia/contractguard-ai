// lib/usage/checkCredits.ts
import { PRICING_LIMITS } from "@/lib/config/pricing";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

interface User {
  id: number;
  plan?: string;
}

interface ScanUsage {
  used: number;
}

/**
 * Check if user can perform a scan based on their subscription plan
 * Handles monthly credit limits and overage pricing
 */
export async function canScan(user: User): Promise<{
  allowed: boolean;
  reason?: string;
  scansRemaining?: number;
  overagePrice?: number;
}> {
  try {
    const plan = user.plan || "free";

    // Free tier users have different logic (daily limits)
    if (plan === "free") {
      return {
        allowed: false,
        reason:
          "Free tier users must use instant reports or upgrade to a subscription plan",
      };
    }

    // Get limits for subscription plans
    const limits = PRICING_LIMITS[plan as keyof typeof PRICING_LIMITS];
    if (!limits) {
      return {
        allowed: false,
        reason: "Invalid subscription plan",
      };
    }

    // Get current month's usage from crypto_audits table
    const currentMonth = new Date();
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const result = await db.execute(
      `SELECT count(*)::int AS used
       FROM crypto_audits
       WHERE user_id=${user.id}
         AND created_at >= '${monthStart.toISOString()}'`
    );

    const used = Number(result.rows[0]?.used) || 0;
    const scansRemaining = Math.max(0, limits.monthlyCredits - used);

    // Check if within monthly limit
    if (used < limits.monthlyCredits) {
      return {
        allowed: true,
        scansRemaining: scansRemaining,
      };
    }

    // User has exceeded monthly limit - allow with overage pricing
    return {
      allowed: true,
      scansRemaining: 0,
      overagePrice: limits.extraScanPrice,
      reason: `Monthly limit exceeded. Additional scans cost $${limits.extraScanPrice} each.`,
    };
  } catch (error) {
    console.error("Error checking scan credits:", error);
    return {
      allowed: false,
      reason: "Error checking scan limits",
    };
  }
}

/**
 * Charge user for overage scan
 */
export async function chargeOverage(
  userId: number,
  overagePrice: number
): Promise<boolean> {
  try {
    // TODO: Implement Stripe overage charging
    // For now, just log the overage charge
    console.log(`Charging user ${userId} $${overagePrice} for overage scan`);

    // In a real implementation, you would:
    // 1. Create a Stripe invoice item
    // 2. Charge the user's saved payment method
    // 3. Handle payment failures

    return true;
  } catch (error) {
    console.error("Error charging overage:", error);
    return false;
  }
}

/**
 * Get user's current usage for the month
 */
export async function getUserUsage(userId: number): Promise<{
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        tier: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const plan = user.tier || "free";
    const limits = PRICING_LIMITS[plan as keyof typeof PRICING_LIMITS];

    if (!limits) {
      throw new Error("Invalid subscription plan");
    }

    // Get current month's usage from crypto_audits table
    const currentMonth = new Date();
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const result = await db.execute(
      `SELECT count(*)::int AS used
       FROM crypto_audits
       WHERE user_id=${userId}
         AND created_at >= '${monthStart.toISOString()}'`
    );

    const used = Number(result.rows[0]?.used) || 0;
    const remaining = Math.max(0, limits.monthlyCredits - used);

    return {
      used,
      limit: limits.monthlyCredits,
      remaining,
      plan,
    };
  } catch (error) {
    console.error("Error getting user usage:", error);
    throw error;
  }
}

/**
 * Reset monthly usage counters (called by cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    // This would typically be called by a cron job at the start of each month
    // For now, we're using date-based queries instead of counters
    console.log("Monthly usage reset completed");
  } catch (error) {
    console.error("Error resetting monthly usage:", error);
    throw error;
  }
}
