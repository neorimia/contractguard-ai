// lib/services/referral.service.ts

import { db } from "@/db";
import {
  users,
  referrals,
  type Referral,
  type NewReferral,
  type User,
} from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import {
  generateReferralCode,
  validateReferralCodeFormat,
} from "@/lib/utils/referral-code";
import { referralConfig } from "@/lib/referrals/config";
import type { ClientInfo } from "@/lib/utils/client-info";
import { RewardsService } from "./rewards.service";
import { AntiFraudService } from "./antifraud.service";
import { ReferralEventsService } from "./referral-events.service";
import { EmailService } from "./email.service";
import { ReferralGamificationService } from "./referral-gamification.service";

export class ReferralService {
  private rewardsService: RewardsService;
  private antifraudService: AntiFraudService;
  private eventsService: ReferralEventsService;
  private emailService: EmailService;
  private gamificationService: ReferralGamificationService;

  constructor() {
    this.rewardsService = new RewardsService();
    this.antifraudService = new AntiFraudService();
    this.eventsService = new ReferralEventsService();
    this.emailService = new EmailService();
    this.gamificationService = new ReferralGamificationService();
  }

  /**
   * Generate unique referral code for user
   */
  async generateReferralCodeForUser(userId: number): Promise<string> {
    try {
      // Check if user already has a code
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.referralCode) {
        return user.referralCode;
      }

      // Generate new code and ensure uniqueness
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = generateReferralCode();
        attempts++;

        // Check if code already exists
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.referralCode, code))
          .limit(1);

        if (!existing) {
          break;
        }

        if (attempts >= maxAttempts) {
          throw new Error("Failed to generate unique referral code");
        }
      } while (true);

      // Save code to user
      await db
        .update(users)
        .set({
          referralCode: code,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Generated referral code ${code} for user ${userId}`);

      return code;
    } catch (error) {
      console.error("Error generating referral code:", error);
      throw new Error("Failed to generate referral code");
    }
  }

  /**
   * Validate referral code exists and is active
   */
  async validateReferralCode(code: string): Promise<{
    valid: boolean;
    referrer?: User;
    error?: string;
  }> {
    try {
      // Validate format
      if (!validateReferralCodeFormat(code)) {
        return {
          valid: false,
          error: "invalid_format",
        };
      }

      // Find referrer
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      if (!referrer) {
        return {
          valid: false,
          error: "code_not_found",
        };
      }

      // Check if referrer can create more referrals
      const canCreate = await this.antifraudService.canCreateReferral(
        referrer.id
      );

      if (!canCreate.allowed) {
        return {
          valid: false,
          error: canCreate.reason,
        };
      }

      return {
        valid: true,
        referrer,
      };
    } catch (error) {
      console.error("Error validating referral code:", error);
      return {
        valid: false,
        error: "validation_error",
      };
    }
  }

  /**
   * Create referral record when user lands on /ref/[code]
   */
  async createReferral(params: {
    referrerCode: string;
    metadata?: {
      ip?: string;
      userAgent?: string;
      fingerprint?: string;
      source?: string;
    };
  }): Promise<{ success: boolean; referralId?: string; error?: string }> {
    try {
      const { referrerCode, metadata } = params;

      // Validate code and get referrer
      const validation = await this.validateReferralCode(referrerCode);

      if (!validation.valid || !validation.referrer) {
        return {
          success: false,
          error: validation.error || "invalid_code",
        };
      }

      const referrer = validation.referrer;

      // Create referral record
      const newReferral: NewReferral = {
        referrerId: referrer.id,
        status: "pending",
        metadata: {
          landingIp: metadata?.ip,
          source: metadata?.source,
        },
      };

      const [referral] = await db
        .insert(referrals)
        .values(newReferral)
        .returning();

      // Log landing event
      await this.eventsService.logEvent({
        referralId: referral.id,
        event: "landing",
        clientInfo: {
          ip: metadata?.ip,
          userAgent: metadata?.userAgent,
          fingerprint: metadata?.fingerprint,
        },
        metadata: {
          source: metadata?.source,
        },
      });

      console.log(
        `Referral created: ${referral.id} for referrer ${referrer.id}`
      );

      return {
        success: true,
        referralId: referral.id,
      };
    } catch (error) {
      console.error("Error creating referral:", error);
      return {
        success: false,
        error: "creation_failed",
      };
    }
  }

  /**
   * Complete referral on signup
   */
  async completeSignup(params: {
    referralCode: string;
    referredUserId: number;
    metadata?: ClientInfo;
  }): Promise<{
    success: boolean;
    reward?: any;
    error?: string;
  }> {
    try {
      const { referralCode, referredUserId, metadata } = params;

      // Find referrer by code
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (!referrer) {
        return { success: false, error: "referrer_not_found" };
      }

      // Prevent self-referral
      if (referrer.id === referredUserId) {
        console.warn(`User ${referredUserId} attempted self-referral`);
        return { success: false, error: "self_referral_not_allowed" };
      }

      // Find or create referral record
      const [existingReferral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrer.id),
            eq(referrals.status, "pending")
          )
        )
        .orderBy(desc(referrals.createdAt))
        .limit(1);

      let referralId: string;

      if (existingReferral) {
        referralId = existingReferral.id;

        // Update with referred user
        await db
          .update(referrals)
          .set({
            referredId: referredUserId,
            metadata: {
              ...existingReferral.metadata,
              signupIp: metadata?.ip,
            },
          })
          .where(eq(referrals.id, referralId));
      } else {
        // Create new referral if landing wasn't tracked
        const [newReferral] = await db
          .insert(referrals)
          .values({
            referrerId: referrer.id,
            referredId: referredUserId,
            status: "pending",
            metadata: {
              signupIp: metadata?.ip,
            },
          })
          .returning();

        referralId = newReferral.id;
      }

      // Get referred user for fraud check
      const [referredUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, referredUserId))
        .limit(1);

      // Log signup event
      await this.eventsService.logEvent({
        referralId,
        event: "signup",
        clientInfo: metadata || {},
      });

      // Fraud check
      const fraudCheck = await this.antifraudService.analyzeFraud({
        referralId,
        clientInfo: metadata || {},
        userEmail: referredUser?.email,
      });

      console.log(
        `Fraud check for referral ${referralId}: score ${fraudCheck.riskScore}`
      );

      // If high risk, keep as pending and don't auto-reward
      if (!fraudCheck.isValid) {
        console.warn(
          `Suspicious referral detected: ${referralId} - ${fraudCheck.reason}`
        );
        // Keep status as pending for manual review
        return {
          success: true,
          error: "pending_verification",
        };
      }

      // Update referred user's referredBy
      await db
        .update(users)
        .set({
          referredBy: referralCode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referredUserId));

      // Apply signup bonus to referred user
      const reward = await this.rewardsService.applyReward(
        referredUserId,
        referralConfig.signupBonusForReferred,
        referralId
      );

      // Send welcome bonus email (non-blocking)
      this.emailService
        .sendWelcomeBonusEmail(referredUser?.email || "", {
          displayName: referredUser?.displayName || undefined,
          referrerName: referrer.displayName || "",
          bonusScans: referralConfig.signupBonusForReferred.amount,
          totalScans: referralConfig.signupBonusForReferred.amount,
          bonusAmount: referralConfig.signupBonusForReferred.amount,
        })
        .catch((error) => {
          console.error("Failed to send welcome email:", error);
        });

      console.log(`Signup bonus applied to user ${referredUserId}`);

      return {
        success: true,
        reward,
      };
    } catch (error) {
      console.error("Error completing signup:", error);
      return {
        success: false,
        error: "signup_completion_failed",
      };
    }
  }

  /**
   * Confirm referral after meaningful action
   */
  async confirmReferral(params: {
    referredUserId: number;
    trigger: "first_audit_complete" | "email_verified";
    metadata?: ClientInfo;
  }): Promise<{
    success: boolean;
    reward?: any;
    error?: string;
  }> {
    try {
      const { referredUserId, trigger, metadata } = params;

      // Find pending referral for this user
      const [referral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referredId, referredUserId),
            eq(referrals.status, "pending")
          )
        )
        .limit(1);

      if (!referral) {
        console.log(`No pending referral found for user ${referredUserId}`);
        return { success: false, error: "no_pending_referral" };
      }

      // Confirm referral
      await db
        .update(referrals)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          metadata: {
            ...referral.metadata,
            confirmIp: metadata?.ip,
            confirmTrigger: trigger,
          },
        })
        .where(eq(referrals.id, referral.id));

      // Log confirmation event
      const eventType =
        trigger === "first_audit_complete" ? "first_audit" : "email_verified";

      await this.eventsService.logEvent({
        referralId: referral.id,
        event: eventType as any,
        clientInfo: metadata || {},
      });

      // Apply reward to referrer
      const reward = await this.rewardsService.applyReward(
        referral.referrerId,
        referralConfig.confirmBonusForReferrer,
        referral.id
      );

      // Mark referral as rewarded
      await db
        .update(referrals)
        .set({
          status: "rewarded",
          rewardedAt: new Date(),
          rewardType: referralConfig.confirmBonusForReferrer.type,
          rewardAmount: referralConfig.confirmBonusForReferrer.amount,
        })
        .where(eq(referrals.id, referral.id));

      // Get referrer for email
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.id, referral.referrerId))
        .limit(1);

      // Send reward notification email (non-blocking)
      if (referrer) {
        this.sendReferralRewardEmail(
          referrer,
          referralConfig.confirmBonusForReferrer.amount,
          "scans"
        ).catch((error) => {
          console.error("Failed to send reward email:", error);
        });
      }

      console.log(`Referral ${referral.id} confirmed and rewarded`);

      // Update referrer's gamification tier
      try {
        await this.gamificationService.updateUserTier(referral.referrerId);
      } catch (error) {
        console.error("Failed to update referrer tier:", error);
      }

      return {
        success: true,
        reward,
      };
    } catch (error) {
      console.error("Error confirming referral:", error);
      return {
        success: false,
        error: "confirmation_failed",
      };
    }
  }

  /**
   * Process instant purchase reward
   * Awards 1 instant credit to referrer when referred user makes instant purchase
   */
  async processInstantPurchase(params: {
    referredUserId: number;
    purchaseAmount: number;
  }): Promise<{
    success: boolean;
    reward?: any;
    error?: string;
  }> {
    try {
      const { referredUserId, purchaseAmount } = params;

      // Find referral for this user
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredId, referredUserId))
        .limit(1);

      if (!referral) {
        console.log(`No referral found for user ${referredUserId}`);
        return { success: false, error: "no_referral_found" };
      }

      // Log instant purchase event
      await this.eventsService.logEvent({
        referralId: referral.id,
        event: "paid",
        clientInfo: {},
        metadata: {
          purchaseType: "instant_credit",
          amount: purchaseAmount,
        },
      });

      // Award 1 instant credit to referrer
      const reward = await this.rewardsService.applyReward(
        referral.referrerId,
        {
          type: "credit" as const,
          amount: 1,
        },
        referral.id
      );

      // Get referrer for email
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.id, referral.referrerId))
        .limit(1);

      // Send instant purchase reward notification email (non-blocking)
      if (referrer) {
        this.sendReferralRewardEmail(referrer, 1, "credit").catch((error) => {
          console.error("Failed to send instant purchase reward email:", error);
        });
      }

      console.log(
        `Instant purchase reward applied for referral ${referral.id}`
      );

      return {
        success: true,
        reward,
      };
    } catch (error) {
      console.error("Error processing instant purchase:", error);
      return {
        success: false,
        error: "instant_purchase_processing_failed",
      };
    }
  }

  /**
   * Process paid conversion
   */
  async processPaidConversion(params: {
    referredUserId: number;
    stripeInvoiceId?: string;
  }): Promise<{
    success: boolean;
    reward?: any;
    error?: string;
  }> {
    try {
      const { referredUserId, stripeInvoiceId } = params;

      // Find referral for this user
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredId, referredUserId))
        .limit(1);

      if (!referral) {
        console.log(`No referral found for user ${referredUserId}`);
        return { success: false, error: "no_referral_found" };
      }

      // Log paid event
      await this.eventsService.logEvent({
        referralId: referral.id,
        event: "paid",
        clientInfo: {},
        metadata: {
          stripeInvoiceId,
        },
      });

      // Apply Pro reward to referrer (credit or Pro month)
      const reward = await this.rewardsService.applyReward(
        referral.referrerId,
        referralConfig.proBonusForReferrer,
        referral.id
      );

      // Get referrer for email
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.id, referral.referrerId))
        .limit(1);

      // Send Pro reward notification email (non-blocking)
      if (referrer) {
        this.sendReferralRewardEmail(
          referrer,
          referralConfig.proBonusForReferrer.amount,
          "credit"
        ).catch((error) => {
          console.error("Failed to send Pro reward email:", error);
        });
      }

      console.log(`Pro conversion reward applied for referral ${referral.id}`);

      return {
        success: true,
        reward,
      };
    } catch (error) {
      console.error("Error processing paid conversion:", error);
      return {
        success: false,
        error: "conversion_processing_failed",
      };
    }
  }

  /**
   * Get referral stats for user dashboard
   */
  async getReferralStats(userId: number): Promise<{
    totalInvites: number;
    pendingInvites: number;
    confirmedInvites: number;
    totalEarned: {
      scans: number;
      credits: number;
    };
    recentReferrals: Referral[];
  }> {
    try {
      // Get all referrals
      const allReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId));

      const totalInvites = allReferrals.length;
      const pendingInvites = allReferrals.filter(
        (r) => r.status === "pending"
      ).length;
      const confirmedInvites = allReferrals.filter(
        (r) => r.status === "confirmed" || r.status === "rewarded"
      ).length;

      // Get total rewards earned
      const totalEarned =
        await this.rewardsService.getTotalRewardsEarned(userId);

      // Get recent referrals (last 10)
      const recentReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .orderBy(desc(referrals.createdAt))
        .limit(10);

      return {
        totalInvites,
        pendingInvites,
        confirmedInvites,
        totalEarned,
        recentReferrals,
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return {
        totalInvites: 0,
        pendingInvites: 0,
        confirmedInvites: 0,
        totalEarned: { scans: 0, credits: 0 },
        recentReferrals: [],
      };
    }
  }

  /**
   * Send referral reward email
   */
  private async sendReferralRewardEmail(
    user: User,
    amount: number,
    type: "scans" | "credit"
  ): Promise<void> {
    try {
      // This would use your email service
      // For now, just log
      console.log(
        `TODO: Send reward email to ${user.email}: ${amount} ${type}`
      );
    } catch (error) {
      console.error("Error sending referral reward email:", error);
    }
  }
}
