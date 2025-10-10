// lib/services/rewards.service.ts

import { db } from "@/db";
import {
  users,
  rewardsLedger,
  type RewardLedger,
  type NewRewardLedger,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { referralConfig } from "@/lib/referrals/config";

export interface RewardConfig {
  type: "scans" | "trial" | "discount" | "credit" | "pro_month";
  amount: number;
  description?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class RewardsService {
  /**
   * Apply reward to user account
   */
  async applyReward(
    userId: number,
    reward: RewardConfig,
    referralId?: string
  ): Promise<RewardLedger> {
    try {
      // Create ledger entry
      const expiresAt =
        reward.expiresAt ||
        new Date(
          Date.now() + referralConfig.rewardExpirationDays * 24 * 60 * 60 * 1000
        );

      const newReward: NewRewardLedger = {
        userId,
        referralId: referralId || null,
        type: reward.type,
        amount: reward.amount,
        status: "applied",
        appliedAt: new Date(),
        expiresAt,
        metadata: {
          description: reward.description,
          ...reward.metadata,
        },
      };

      const [ledgerEntry] = await db
        .insert(rewardsLedger)
        .values(newReward)
        .returning();

      // Apply reward based on type
      switch (reward.type) {
        case "scans":
          await this.applyBonusScans(userId, reward.amount);
          break;

        case "trial":
          await this.grantProTrial(userId, reward.amount);
          break;

        case "credit":
          // Credit will be applied via Stripe
          console.log(
            `Credit reward created for user ${userId}: $${reward.amount / 100}`
          );
          break;

        case "pro_month":
          await this.grantProTrial(userId, 30); // 30 days
          break;

        default:
          console.warn(`Unknown reward type: ${reward.type}`);
      }

      console.log(
        `Reward applied: ${reward.type} (${reward.amount}) to user ${userId}`
      );

      return ledgerEntry;
    } catch (error) {
      console.error("Error applying reward:", error);
      throw new Error("Failed to apply reward");
    }
  }

  /**
   * Apply bonus scans to user account
   */
  private async applyBonusScans(userId: number, amount: number): Promise<void> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const newBonusScans = (user.bonusScans || 0) + amount;

      await db
        .update(users)
        .set({
          bonusScans: newBonusScans,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `Added ${amount} bonus scans to user ${userId}. New total: ${newBonusScans}`
      );
    } catch (error) {
      console.error("Error applying bonus scans:", error);
      throw error;
    }
  }

  /**
   * Get total bonus scans available for user
   */
  async getBonusScansBalance(userId: number): Promise<number> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user?.bonusScans || 0;
    } catch (error) {
      console.error("Error getting bonus scans balance:", error);
      return 0;
    }
  }

  /**
   * Consume bonus scan (when user performs audit)
   */
  async consumeBonusScan(userId: number): Promise<{
    success: boolean;
    remainingBonus: number;
  }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return { success: false, remainingBonus: 0 };
      }

      const bonusScans = user.bonusScans || 0;

      if (bonusScans <= 0) {
        return { success: false, remainingBonus: 0 };
      }

      const newBonusScans = bonusScans - 1;

      await db
        .update(users)
        .set({
          bonusScans: newBonusScans,
          bonusScansUsedToday: (user.bonusScansUsedToday || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `Consumed 1 bonus scan for user ${userId}. Remaining: ${newBonusScans}`
      );

      return {
        success: true,
        remainingBonus: newBonusScans,
      };
    } catch (error) {
      console.error("Error consuming bonus scan:", error);
      return { success: false, remainingBonus: 0 };
    }
  }

  /**
   * Reset daily bonus scan usage counter
   */
  async resetDailyBonusUsage(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          bonusScansUsedToday: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Reset daily bonus usage for user ${userId}`);
    } catch (error) {
      console.error("Error resetting daily bonus usage:", error);
    }
  }

  /**
   * Apply credit to user's Stripe account
   */
  async applyStripeCredit(
    userId: number,
    amountInCents: number,
    description: string
  ): Promise<{ success: boolean; creditId?: string }> {
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("Stripe not configured, skipping credit application");
        return { success: false };
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user?.stripeCustomerId) {
        console.warn(`User ${userId} has no Stripe customer ID`);
        return { success: false };
      }

      // Import Stripe dynamically to avoid errors if not configured
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-09-30.clover",
      });

      // Create customer balance transaction (credit)
      const credit = await stripe.customers.createBalanceTransaction(
        user.stripeCustomerId,
        {
          amount: -amountInCents, // Negative = credit
          currency: "usd",
          description,
        }
      );

      // Record in ledger
      await db.insert(rewardsLedger).values({
        userId: user.id,
        type: "credit",
        amount: amountInCents,
        status: "applied",
        appliedAt: new Date(),
        metadata: {
          description,
          stripeBalanceTxnId: credit.id,
        },
      });

      console.log(`Applied $${amountInCents / 100} credit to user ${userId}`);

      return { success: true, creditId: credit.id };
    } catch (error) {
      console.error("Failed to apply Stripe credit:", error);
      return { success: false };
    }
  }

  /**
   * Grant Pro subscription for specified duration
   */
  async grantProTrial(
    userId: number,
    durationDays: number
  ): Promise<{ success: boolean }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await db
        .update(users)
        .set({
          tier: "pro",
          subscriptionStatus: "trial",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Record in ledger
      await db.insert(rewardsLedger).values({
        userId,
        type: "trial",
        amount: durationDays,
        status: "applied",
        appliedAt: new Date(),
        expiresAt,
        metadata: {
          description: `${durationDays} day Pro trial`,
        },
      });

      console.log(`Granted ${durationDays} day Pro trial to user ${userId}`);

      return { success: true };
    } catch (error) {
      console.error("Error granting Pro trial:", error);
      return { success: false };
    }
  }

  /**
   * Get reward history for user
   */
  async getRewardHistory(userId: number): Promise<RewardLedger[]> {
    try {
      const rewards = await db
        .select()
        .from(rewardsLedger)
        .where(eq(rewardsLedger.userId, userId))
        .orderBy(desc(rewardsLedger.createdAt));

      return rewards;
    } catch (error) {
      console.error("Error fetching reward history:", error);
      return [];
    }
  }

  /**
   * Revoke reward (fraud detection)
   */
  async revokeReward(
    rewardId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    try {
      const [reward] = await db
        .select()
        .from(rewardsLedger)
        .where(eq(rewardsLedger.id, rewardId))
        .limit(1);

      if (!reward) {
        return { success: false };
      }

      // Mark reward as revoked
      await db
        .update(rewardsLedger)
        .set({
          status: "revoked",
          metadata: {
            ...reward.metadata,
            revokeReason: reason,
            revokedAt: new Date().toISOString(),
          },
        })
        .where(eq(rewardsLedger.id, rewardId));

      // Reverse the reward if it was scans
      if (reward.type === "scans" && reward.status === "applied") {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, reward.userId))
          .limit(1);

        if (user) {
          const newBonusScans = Math.max(
            0,
            (user.bonusScans || 0) - reward.amount
          );

          await db
            .update(users)
            .set({
              bonusScans: newBonusScans,
              updatedAt: new Date(),
            })
            .where(eq(users.id, reward.userId));

          console.log(
            `Revoked ${reward.amount} bonus scans from user ${reward.userId}`
          );
        }
      }

      console.log(`Reward ${rewardId} revoked: ${reason}`);

      return { success: true };
    } catch (error) {
      console.error("Error revoking reward:", error);
      return { success: false };
    }
  }

  /**
   * Get total rewards earned by user
   */
  async getTotalRewardsEarned(userId: number): Promise<{
    scans: number;
    credits: number;
  }> {
    try {
      const rewards = await db
        .select()
        .from(rewardsLedger)
        .where(
          and(
            eq(rewardsLedger.userId, userId),
            eq(rewardsLedger.status, "applied")
          )
        );

      const scans = rewards
        .filter((r) => r.type === "scans")
        .reduce((sum, r) => sum + r.amount, 0);

      const credits = rewards
        .filter((r) => r.type === "credit")
        .reduce((sum, r) => sum + r.amount, 0);

      return { scans, credits };
    } catch (error) {
      console.error("Error getting total rewards:", error);
      return { scans: 0, credits: 0 };
    }
  }
}
