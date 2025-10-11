// lib/services/referral-gamification.service.ts

import { db } from "@/db";
import {
  users,
  referrals,
  referralTierAchievements,
  referralCommissions,
  referralRewards,
  type ReferralTierAchievement,
  type ReferralCommission,
  type ReferralReward,
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
import {
  isRewardProfitable,
  isTierUnlocked,
  calculateRewardValue,
} from "@/lib/referrals/roi-validation";
import { isInCooldown, getCooldownStatus } from "@/lib/referrals/cooldown";
import { EmailService } from "./email.service";

export class ReferralGamificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Check and update user's referral tier based on confirmed referrals
   * Includes ROI validation and cooldown enforcement
   */
  async updateUserTier(userId: number): Promise<{
    tierChanged: boolean;
    oldTier: string;
    newTier: ReferralTier;
    achievement?: ReferralTierAchievement;
    rewardApplied: boolean;
    rewardSkipReason?: string;
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
      const paidReferrals = user.paidReferrals || 0;
      const referredRevenue = user.referredRevenue || 0;

      const newTier = getTierFromCount(referralCount, paidReferrals);
      const oldTier = user.referralTier || "none";

      // Check if tier changed
      if (newTier.id === oldTier) {
        return {
          tierChanged: false,
          oldTier,
          newTier,
          rewardApplied: false,
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
          tier: newTier.id as "bronze" | "iron" | "silver" | "gold" | "platinum" | "ambassador",
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
        `User ${userId} tier upgraded: ${oldTier} → ${newTier.id} (${referralCount} referrals, ${paidReferrals} paid)`
      );

      // Check cooldown status
      const cooldownStatus = getCooldownStatus(user.lastReferralRewardAt);
      const rewardValue = calculateRewardValue(newTier.id as any);
      const roiRatio = referredRevenue > 0 ? Math.floor((referredRevenue / rewardValue) * 100) : 0;

      if (cooldownStatus.isActive) {
        console.log(
          `[Referral] Cooldown active for user ${userId}: ${cooldownStatus.humanReadable}`
        );

        // Log denied reward due to cooldown
        await this.logRewardDecision({
          userId,
          achievementId: achievement.id,
          tier: newTier.id as any,
          rewardType: newTier.reward.type as any,
          status: "denied",
          denialReason: `Cooldown active: ${cooldownStatus.humanReadable}`,
          rewardValue,
          revenueAtTime: referredRevenue,
          roiRatio,
          totalReferrals: referralCount,
          paidReferrals,
          wasInCooldown: true,
          cooldownDaysRemaining: cooldownStatus.daysRemaining,
          validationChecks: {
            cooldown: false,
            tierUnlocked: true,
            roiProfitable: null,
          },
        });

        return {
          tierChanged: true,
          oldTier,
          newTier,
          achievement,
          rewardApplied: false,
          rewardSkipReason: `Reward delayed: ${cooldownStatus.humanReadable}`,
        };
      }

      // Check tier unlock (both referral count and paid count met)
      const tierUnlocked = isTierUnlocked(
        referralCount,
        paidReferrals,
        newTier.id as any
      );
      if (!tierUnlocked) {
        console.log(
          `[Referral] Tier ${newTier.id} not fully unlocked for user ${userId}: needs ${newTier.paidReferralsRequired - paidReferrals} more paid referrals`
        );

        // Log denied reward due to tier not fully unlocked
        await this.logRewardDecision({
          userId,
          achievementId: achievement.id,
          tier: newTier.id as any,
          rewardType: newTier.reward.type as any,
          status: "denied",
          denialReason: `Need ${newTier.paidReferralsRequired - paidReferrals} more paying referrals`,
          rewardValue,
          revenueAtTime: referredRevenue,
          roiRatio,
          totalReferrals: referralCount,
          paidReferrals,
          wasInCooldown: false,
          cooldownDaysRemaining: 0,
          validationChecks: {
            cooldown: true,
            tierUnlocked: false,
            roiProfitable: null,
          },
        });

        return {
          tierChanged: true,
          oldTier,
          newTier,
          achievement,
          rewardApplied: false,
          rewardSkipReason: `Need ${newTier.paidReferralsRequired - paidReferrals} more paying referrals to unlock reward`,
        };
      }

      // Check ROI profitability (skip for Bronze tier with 0 paid requirement)
      if (newTier.paidReferralsRequired > 0) {
        const isProfitable = isRewardProfitable(
          newTier.id as any,
          referredRevenue
        );
        if (!isProfitable) {
          console.warn(
            `[Referral] ROI check failed for user ${userId} at tier ${newTier.id}. Reward skipped.`
          );

          // Log denied reward due to ROI failure
          await this.logRewardDecision({
            userId,
            achievementId: achievement.id,
            tier: newTier.id as any,
            rewardType: newTier.reward.type as any,
            status: "denied",
            denialReason: "Revenue threshold not met (ROI < 5×)",
            rewardValue,
            revenueAtTime: referredRevenue,
            roiRatio,
            totalReferrals: referralCount,
            paidReferrals,
            wasInCooldown: false,
            cooldownDaysRemaining: 0,
            validationChecks: {
              cooldown: true,
              tierUnlocked: true,
              roiProfitable: false,
            },
          });

          return {
            tierChanged: true,
            oldTier,
            newTier,
            achievement,
            rewardApplied: false,
            rewardSkipReason:
              "Revenue threshold not met - reward will be granted when sufficient revenue is generated",
          };
        }
      }

      // All checks passed - apply tier reward
      await this.applyTierReward(userId, newTier);

      // Log granted reward
      await this.logRewardDecision({
        userId,
        achievementId: achievement.id,
        tier: newTier.id as any,
        rewardType: newTier.reward.type as any,
        status: "granted",
        denialReason: null,
        rewardValue,
        revenueAtTime: referredRevenue,
        roiRatio,
        totalReferrals: referralCount,
        paidReferrals,
        wasInCooldown: false,
        cooldownDaysRemaining: 0,
        validationChecks: {
          cooldown: true,
          tierUnlocked: true,
          roiProfitable: newTier.paidReferralsRequired > 0,
        },
      });

      // Update lastReferralRewardAt timestamp
      await db
        .update(users)
        .set({
          lastReferralRewardAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

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
        rewardApplied: true,
      };
    } catch (error) {
      console.error("Error updating user tier:", error);
      throw new Error("Failed to update user tier");
    }
  }

  /**
   * Apply tier reward to user account
   * Updated for new hybrid model with Iron tier and revised rewards
   */
  private async applyTierReward(
    userId: number,
    tier: ReferralTier
  ): Promise<void> {
    try {
      switch (tier.reward.type) {
        case "trial": {
          // Map tier to trial days
          const trialDaysMap: Record<string, number> = {
            bronze: 7, // 7-day Pro trial
            iron: 14, // 14-day Pro trial
          };

          const trialDays = trialDaysMap[tier.id] || 0;
          if (trialDays > 0) {
            // Add bonus scans for trial period (days × 20 scans/day)
            const bonusScans = trialDays * 20;
            await db
              .update(users)
              .set({
                bonusScans: sql`${users.bonusScans} + ${bonusScans}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));

            console.log(
              `Applied ${trialDays}-day Pro trial (${bonusScans} scans) to user ${userId}`
            );
          }
          break;
        }

        case "subscription": {
          // Map tier to subscription months and credits
          // Silver: 1 month = 600 scans, Gold: 2 months = 1200 scans
          const subscriptionMap: Record<string, number> = {
            silver: 1, // 1 month Pro + 5% commission
            gold: 2, // 2 months Pro + 10% commission
          };

          const months = subscriptionMap[tier.id] || 0;
          const creditsToAdd = months * 600; // 600 scans per month

          if (creditsToAdd > 0) {
            await db
              .update(users)
              .set({
                instantCredits: sql`${users.instantCredits} + ${creditsToAdd}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));

            console.log(
              `Applied ${months}-month Pro subscription (${creditsToAdd} credits) to user ${userId}`
            );
          }
          break;
        }

        case "lifetime": {
          // Platinum: 3 months Pro + 10% commission
          const platinumCredits = 3 * 600; // 1800 scans
          await db
            .update(users)
            .set({
              instantCredits: sql`${users.instantCredits} + ${platinumCredits}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          console.log(
            `Applied 3-month Pro subscription (${platinumCredits} credits) to user ${userId}`
          );
          break;
        }

        case "commission": {
          // Ambassador: Lifetime Pro + 20% commission
          await db
            .update(users)
            .set({
              tier: "pro",
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          // Commission is handled automatically in processCommission method
          console.log(
            `User ${userId} is now an Ambassador with Lifetime Pro + 20% commission rate`
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
   * Updated with paid referrals and cooldown information
   */
  async getUserDashboard(userId: number): Promise<{
    currentTier: ReferralTier;
    nextTier: ReferralTier | null;
    progress: number;
    referralsNeeded: number;
    paidReferralsNeeded: number;
    totalReferrals: number;
    paidReferrals: number;
    referredRevenue: number;
    activeCommissions: number;
    totalEarnings: number;
    lifetimeCommission: number;
    cooldown: {
      isActive: boolean;
      daysRemaining: number;
      nextAvailableDate: Date | null;
      humanReadable: string;
    };
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
      const paidReferrals = user.paidReferrals || 0;
      const referredRevenue = user.referredRevenue || 0;

      const tierInfo = getNextTier(referralCount, paidReferrals);

      // Get cooldown status
      const cooldownStatus = getCooldownStatus(user.lastReferralRewardAt);

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
        paidReferralsNeeded: tierInfo.paidReferralsNeeded,
        totalReferrals: referralCount,
        paidReferrals,
        referredRevenue,
        activeCommissions: commissionsResult?.count || 0,
        totalEarnings: user.totalReferralEarnings || 0,
        lifetimeCommission: user.lifetimeCommission || 0,
        cooldown: cooldownStatus,
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
   * Log reward decision to audit trail
   * Tracks all reward grants and denials with ROI data
   */
  private async logRewardDecision(params: {
    userId: number;
    achievementId: string;
    tier: "bronze" | "iron" | "silver" | "gold" | "platinum" | "ambassador";
    rewardType: "trial" | "subscription" | "lifetime" | "commission";
    status: "granted" | "denied" | "pending";
    denialReason: string | null;
    rewardValue: number;
    revenueAtTime: number;
    roiRatio: number;
    totalReferrals: number;
    paidReferrals: number;
    wasInCooldown: boolean;
    cooldownDaysRemaining: number;
    validationChecks: {
      cooldown: boolean;
      tierUnlocked: boolean;
      roiProfitable: boolean | null;
    };
  }): Promise<void> {
    try {
      await db.insert(referralRewards).values({
        userId: params.userId,
        achievementId: params.achievementId,
        tier: params.tier,
        rewardType: params.rewardType,
        status: params.status,
        denialReason: params.denialReason,
        rewardValue: params.rewardValue,
        revenueAtTime: params.revenueAtTime,
        roiRatio: params.roiRatio,
        totalReferrals: params.totalReferrals,
        paidReferrals: params.paidReferrals,
        wasInCooldown: params.wasInCooldown,
        cooldownDaysRemaining: params.cooldownDaysRemaining,
        metadata: {
          validationChecks: params.validationChecks,
          rewardDetails: `${params.tier} tier ${params.rewardType}`,
        },
      });

      console.log(
        `[Reward Audit] ${params.status.toUpperCase()} - User ${params.userId} | Tier ${params.tier} | Revenue: $${(params.revenueAtTime / 100).toFixed(2)} | ROI: ${(params.roiRatio / 100).toFixed(2)}×`
      );
    } catch (error) {
      console.error("Error logging reward decision:", error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get reward audit analytics
   * Provides insights into reward grant rates, ROI performance, and denial reasons
   */
  async getRewardAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
    tier?: "bronze" | "iron" | "silver" | "gold" | "platinum" | "ambassador";
    status?: "granted" | "denied" | "pending";
  }): Promise<{
    totalRewards: number;
    grantedCount: number;
    deniedCount: number;
    grantRate: number;
    averageROI: number;
    totalRewardValue: number;
    totalRevenue: number;
    denialReasons: Array<{ reason: string; count: number }>;
    tierBreakdown: Array<{
      tier: string;
      granted: number;
      denied: number;
      avgROI: number;
    }>;
  }> {
    try {
      // Build query with optional filters
      let queryConditions: any[] = [];

      if (params?.startDate) {
        queryConditions.push(gte(referralRewards.issuedAt, params.startDate));
      }
      if (params?.endDate) {
        queryConditions.push(sql`${referralRewards.issuedAt} <= ${params.endDate}`);
      }
      if (params?.tier) {
        queryConditions.push(eq(referralRewards.tier, params.tier));
      }
      if (params?.status) {
        queryConditions.push(eq(referralRewards.status, params.status));
      }

      const rewards = queryConditions.length > 0
        ? await db.select().from(referralRewards).where(and(...queryConditions))
        : await db.select().from(referralRewards);

      // Calculate metrics
      const totalRewards = rewards.length;
      const grantedCount = rewards.filter((r) => r.status === "granted").length;
      const deniedCount = rewards.filter((r) => r.status === "denied").length;
      const grantRate = totalRewards > 0 ? (grantedCount / totalRewards) * 100 : 0;

      const totalROI = rewards.reduce((sum, r) => sum + (r.roiRatio || 0), 0);
      const averageROI = totalRewards > 0 ? totalROI / totalRewards / 100 : 0;

      const totalRewardValue = rewards
        .filter((r) => r.status === "granted")
        .reduce((sum, r) => sum + r.rewardValue, 0);

      const totalRevenue = rewards.reduce(
        (sum, r) => sum + (r.revenueAtTime || 0),
        0
      );

      // Denial reason breakdown
      const denialReasonMap = new Map<string, number>();
      rewards
        .filter((r) => r.status === "denied" && r.denialReason)
        .forEach((r) => {
          const count = denialReasonMap.get(r.denialReason!) || 0;
          denialReasonMap.set(r.denialReason!, count + 1);
        });

      const denialReasons = Array.from(denialReasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      // Tier breakdown
      const tierMap = new Map<
        string,
        { granted: number; denied: number; roiSum: number }
      >();
      rewards.forEach((r) => {
        const existing = tierMap.get(r.tier) || {
          granted: 0,
          denied: 0,
          roiSum: 0,
        };
        if (r.status === "granted") existing.granted++;
        if (r.status === "denied") existing.denied++;
        existing.roiSum += r.roiRatio || 0;
        tierMap.set(r.tier, existing);
      });

      const tierBreakdown = Array.from(tierMap.entries())
        .map(([tier, data]) => ({
          tier,
          granted: data.granted,
          denied: data.denied,
          avgROI: (data.granted + data.denied) > 0
            ? data.roiSum / (data.granted + data.denied) / 100
            : 0,
        }))
        .sort((a, b) => (b.granted + b.denied) - (a.granted + a.denied));

      return {
        totalRewards,
        grantedCount,
        deniedCount,
        grantRate,
        averageROI,
        totalRewardValue,
        totalRevenue,
        denialReasons,
        tierBreakdown,
      };
    } catch (error) {
      console.error("Error getting reward analytics:", error);
      throw new Error("Failed to get reward analytics");
    }
  }

  /**
   * Get user's reward history
   */
  async getUserRewardHistory(
    userId: number
  ): Promise<Array<ReferralReward>> {
    try {
      return await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, userId))
        .orderBy(desc(referralRewards.issuedAt));
    } catch (error) {
      console.error("Error getting user reward history:", error);
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
