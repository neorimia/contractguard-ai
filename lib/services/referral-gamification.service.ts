// lib/services/referral-gamification.service.ts

import { db } from "@/db";
import {
  users,
  referrals,
  referralTierAchievements,
  referralCommissions,
  type ReferralTierAchievement,
  type ReferralCommission,
  type User,
} from "@/db/schema";
import { eq, and, desc, count, sql, gte } from "drizzle-orm";
import {
  REFERRAL_TIERS,
  getTierFromCount,
  getNextTier,
  calculateCommission,
  type ReferralTier,
} from "@/lib/referrals/gamification-config";
import { EmailService } from "./email.service";

export class ReferralGamificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Check and update user's referral tier based on confirmed referrals
   */
  async updateUserTier(userId: number): Promise<{
    tierChanged: boolean;
    oldTier: string;
    newTier: ReferralTier;
    achievement?: ReferralTierAchievement;
  }> {
    try {
      // Get user's current tier and confirmed referral count
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      // Count confirmed referrals (status = 'confirmed' or 'rewarded')
      const [result] = await db
        .select({ count: count() })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, userId),
            sql`${referrals.status} IN ('confirmed', 'rewarded')`
          )
        );

      const referralCount = result?.count || 0;
      const newTier = getTierFromCount(referralCount);
      const oldTier = user.referralTier || "none";

      // Check if tier changed
      if (newTier.id === oldTier) {
        return {
          tierChanged: false,
          oldTier,
          newTier,
        };
      }

      // Update user's tier and referral count
      await db
        .update(users)
        .set({
          referralTier: newTier.id,
          referralCount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Create tier achievement record
      const [achievement] = await db
        .insert(referralTierAchievements)
        .values({
          userId,
          tier: newTier.id as any,
          referralsRequired: newTier.referralsRequired,
          rewardType: newTier.reward.type,
          rewardDescription: newTier.reward.description,
          metadata: {
            badge: newTier.badge,
            announcement: `🎉 Congratulations! You've reached ${newTier.name} tier!`,
            specialPerks: newTier.perks,
          },
        })
        .returning();

      console.log(
        `User ${userId} tier upgraded: ${oldTier} → ${newTier.id} (${referralCount} referrals)`
      );

      // Apply tier reward
      await this.applyTierReward(userId, newTier);

      // Send tier achievement email (non-blocking)
      this.sendTierAchievementEmail(user, newTier, referralCount).catch(
        (error) => {
          console.error("Failed to send tier achievement email:", error);
        }
      );

      return {
        tierChanged: true,
        oldTier,
        newTier,
        achievement,
      };
    } catch (error) {
      console.error("Error updating user tier:", error);
      throw new Error("Failed to update user tier");
    }
  }

  /**
   * Apply tier reward to user account
   */
  private async applyTierReward(
    userId: number,
    tier: ReferralTier
  ): Promise<void> {
    try {
      switch (tier.reward.type) {
        case "trial": {
          // Add trial period
          const trialDays = tier.id === "bronze" ? 7 : 0;
          if (trialDays > 0) {
            // Add bonus scans for trial period (7 days × 20 scans = 140 scans)
            await db
              .update(users)
              .set({
                bonusScans: sql`${users.bonusScans} + ${trialDays * 20}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
          }
          break;
        }

        case "subscription": {
          // Add subscription months as instant credits
          // Silver: 1 month = 600 scans, Gold: 3 months = 1800 scans
          const months = tier.id === "silver" ? 1 : tier.id === "gold" ? 3 : 0;
          const creditsToAdd = months * 600;

          if (creditsToAdd > 0) {
            await db
              .update(users)
              .set({
                instantCredits: sql`${users.instantCredits} + ${creditsToAdd}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
          }
          break;
        }

        case "lifetime": {
          // Platinum: Upgrade to Pro tier permanently
          await db
            .update(users)
            .set({
              tier: "pro",
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
          break;
        }

        case "commission": {
          // Ambassador: Upgrade to Pro + enable 20% commission
          await db
            .update(users)
            .set({
              tier: "pro",
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          // Commission is handled automatically in processCommission method
          console.log(
            `User ${userId} is now an Ambassador with 20% commission rate`
          );
          break;
        }
      }
    } catch (error) {
      console.error("Error applying tier reward:", error);
      throw new Error("Failed to apply tier reward");
    }
  }

  /**
   * Create commission record for subscription referral
   */
  async createCommission(params: {
    referrerId: number;
    referredUserId: number;
    subscriptionTier: "pro" | "team";
    stripeSubscriptionId: string;
    subscriptionAmount: number; // in cents
  }): Promise<ReferralCommission | null> {
    try {
      const {
        referrerId,
        referredUserId,
        subscriptionTier,
        stripeSubscriptionId,
        subscriptionAmount,
      } = params;

      // Get referrer's tier to determine commission rate
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.id, referrerId))
        .limit(1);

      if (!referrer) {
        console.error(`Referrer ${referrerId} not found`);
        return null;
      }

      // Calculate commission (10% base, 20% for ambassador)
      const commissionAmount = calculateCommission(
        subscriptionAmount,
        referrer.referralTier as any
      );

      // Calculate next payout date (30 days from now)
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 30);

      // Create commission record
      const [commission] = await db
        .insert(referralCommissions)
        .values({
          referrerId,
          referredUserId,
          subscriptionTier,
          monthlyCommission: commissionAmount,
          totalEarned: 0,
          status: "active",
          stripeSubscriptionId,
          nextPayoutDate,
          metadata: {
            payoutHistory: [],
          },
        })
        .returning();

      console.log(
        `Commission created: ${referrerId} earns $${(commissionAmount / 100).toFixed(2)}/month from ${referredUserId}`
      );

      return commission;
    } catch (error) {
      console.error("Error creating commission:", error);
      return null;
    }
  }

  /**
   * Process monthly commission payout
   */
  async processCommissionPayout(commissionId: string): Promise<{
    success: boolean;
    amount?: number;
    error?: string;
  }> {
    try {
      const [commission] = await db
        .select()
        .from(referralCommissions)
        .where(eq(referralCommissions.id, commissionId))
        .limit(1);

      if (!commission || commission.status !== "active") {
        return { success: false, error: "Commission not active" };
      }

      // Add commission to user's instant credits
      await db
        .update(users)
        .set({
          instantCredits: sql`${users.instantCredits} + ${Math.floor(commission.monthlyCommission / 499)}`, // Convert to scans ($4.99 per scan)
          totalReferralEarnings: sql`${users.totalReferralEarnings} + ${commission.monthlyCommission}`,
          lifetimeCommission: sql`${users.lifetimeCommission} + ${commission.monthlyCommission}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, commission.referrerId));

      // Update commission record
      const nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 30);

      const payoutHistory = commission.metadata?.payoutHistory || [];
      payoutHistory.push({
        date: new Date().toISOString(),
        amount: commission.monthlyCommission,
      });

      await db
        .update(referralCommissions)
        .set({
          totalEarned: sql`${referralCommissions.totalEarned} + ${commission.monthlyCommission}`,
          lastPayoutDate: new Date(),
          nextPayoutDate,
          metadata: {
            ...commission.metadata,
            payoutHistory,
          },
          updatedAt: new Date(),
        })
        .where(eq(referralCommissions.id, commissionId));

      console.log(
        `Commission payout processed: $${(commission.monthlyCommission / 100).toFixed(2)} to user ${commission.referrerId}`
      );

      return {
        success: true,
        amount: commission.monthlyCommission,
      };
    } catch (error) {
      console.error("Error processing commission payout:", error);
      return {
        success: false,
        error: "Payout processing failed",
      };
    }
  }

  /**
   * End commission when subscription is cancelled
   */
  async endCommission(stripeSubscriptionId: string): Promise<void> {
    try {
      await db
        .update(referralCommissions)
        .set({
          status: "ended",
          updatedAt: new Date(),
        })
        .where(
          eq(referralCommissions.stripeSubscriptionId, stripeSubscriptionId)
        );

      console.log(`Commission ended for subscription ${stripeSubscriptionId}`);
    } catch (error) {
      console.error("Error ending commission:", error);
    }
  }

  /**
   * Get user's referral dashboard data
   */
  async getUserDashboard(userId: number): Promise<{
    currentTier: ReferralTier;
    nextTier: ReferralTier | null;
    progress: number;
    referralsNeeded: number;
    totalReferrals: number;
    activeCommissions: number;
    totalEarnings: number;
    lifetimeCommission: number;
    achievements: ReferralTierAchievement[];
    recentReferrals: Array<{
      date: string;
      status: string;
      reward: string;
    }>;
  }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const referralCount = user.referralCount || 0;
      const tierInfo = getNextTier(referralCount);

      // Get active commissions
      const [commissionsResult] = await db
        .select({ count: count() })
        .from(referralCommissions)
        .where(
          and(
            eq(referralCommissions.referrerId, userId),
            eq(referralCommissions.status, "active")
          )
        );

      // Get achievements
      const achievements = await db
        .select()
        .from(referralTierAchievements)
        .where(eq(referralTierAchievements.userId, userId))
        .orderBy(desc(referralTierAchievements.achievedAt));

      // Get recent referrals
      const recentReferrals = await db
        .select({
          createdAt: referrals.createdAt,
          status: referrals.status,
          rewardType: referrals.rewardType,
          rewardAmount: referrals.rewardAmount,
        })
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .orderBy(desc(referrals.createdAt))
        .limit(10);

      return {
        currentTier: tierInfo.currentTier,
        nextTier: tierInfo.nextTier,
        progress: tierInfo.progress,
        referralsNeeded: tierInfo.referralsNeeded,
        totalReferrals: referralCount,
        activeCommissions: commissionsResult?.count || 0,
        totalEarnings: user.totalReferralEarnings || 0,
        lifetimeCommission: user.lifetimeCommission || 0,
        achievements,
        recentReferrals: recentReferrals.map((r) => ({
          date: r.createdAt?.toISOString() || "",
          status: r.status,
          reward: r.rewardType
            ? `${r.rewardAmount} ${r.rewardType}`
            : "Pending",
        })),
      };
    } catch (error) {
      console.error("Error getting user dashboard:", error);
      throw new Error("Failed to get dashboard data");
    }
  }

  /**
   * Get leaderboard top referrers
   */
  async getLeaderboard(limit: number = 100): Promise<
    Array<{
      rank: number;
      userId: number;
      displayName: string;
      referralCount: number;
      tier: string;
      badge: string;
    }>
  > {
    try {
      const topReferrers = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          referralCount: users.referralCount,
          referralTier: users.referralTier,
        })
        .from(users)
        .where(gte(users.referralCount, 1))
        .orderBy(desc(users.referralCount))
        .limit(limit);

      return topReferrers.map((user, index) => {
        const tier = REFERRAL_TIERS[user.referralTier || "none"];
        return {
          rank: index + 1,
          userId: user.id,
          displayName:
            user.displayName || user.email?.split("@")[0] || "Anonymous",
          referralCount: user.referralCount || 0,
          tier: tier.name,
          badge: tier.badge,
        };
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  /**
   * Send tier achievement email
   */
  private async sendTierAchievementEmail(
    user: User,
    tier: ReferralTier,
    referralCount: number
  ): Promise<void> {
    try {
      // TODO: Implement with your email service
      console.log(
        `TODO: Send tier achievement email to ${user.email}: ${tier.name} (${referralCount} referrals)`
      );
      // This would use EmailService to send a beautiful email
      // with tier badge, perks, and reward details
    } catch (error) {
      console.error("Error sending tier achievement email:", error);
    }
  }
}
