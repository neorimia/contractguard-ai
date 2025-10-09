// lib/services/antifraud.service.ts

import { db } from "@/db";
import { users, referrals } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import {
  type FraudCheckResult,
  antifraudRules,
  calculateRiskScore,
  isDisposableEmail,
  getRiskLevel,
} from "@/lib/referrals/antifraud";
import type { ClientInfo } from "@/lib/utils/client-info";
import { ReferralEventsService } from "./referral-events.service";

export class AntiFraudService {
  private eventsService: ReferralEventsService;

  constructor() {
    this.eventsService = new ReferralEventsService();
  }

  /**
   * Analyze referral for fraud indicators
   */
  async analyzeFraud(params: {
    referralId: string;
    clientInfo: ClientInfo;
    userEmail?: string;
  }): Promise<FraudCheckResult> {
    try {
      const { referralId, clientInfo, userEmail } = params;
      const flags: string[] = [];

      // Check IP reputation
      const ipCheck = await this.checkIpReputation(clientInfo.ip || "");
      if (ipCheck.isSuspicious) {
        flags.push(`ip_suspicious: ${ipCheck.reason}`);
      }

      // Check fingerprint usage
      let fingerprintCount = 0;
      if (clientInfo.fingerprint) {
        const fingerprintCheck = await this.checkFingerprint(
          clientInfo.fingerprint
        );
        if (fingerprintCheck.isSuspicious) {
          flags.push(
            `fingerprint_suspicious: ${fingerprintCheck.usageCount} signups`
          );
        }
        fingerprintCount = fingerprintCheck.usageCount;
      }

      // Check email if provided
      let isDisposable = false;
      if (userEmail) {
        const emailCheck = await this.validateEmail(userEmail);
        if (emailCheck.isDisposable) {
          flags.push("disposable_email");
          isDisposable = true;
        }
      }

      // Check timing
      const timingCheck = await this.validateTiming(referralId);
      let timeBetween: number | undefined;
      if (!timingCheck.isValid) {
        flags.push(`timing_anomaly: ${timingCheck.reason}`);
        timeBetween = timingCheck.timeBetweenSeconds;
      }

      // Calculate risk score
      const riskScore = calculateRiskScore({
        sameIpCount: ipCheck.signupsToday,
        sameFingerprintCount: fingerprintCount,
        isDisposableEmail: isDisposable,
        timeBetweenLandingAndSignup: timeBetween,
      });

      const isValid = riskScore < antifraudRules.riskScoreThresholds.high;

      return {
        isValid,
        reason: flags.length > 0 ? flags.join(", ") : undefined,
        riskScore,
        flags,
      };
    } catch (error) {
      console.error("Error analyzing fraud:", error);
      // On error, be conservative and flag as suspicious
      return {
        isValid: false,
        reason: "analysis_error",
        riskScore: 75,
        flags: ["analysis_error"],
      };
    }
  }

  /**
   * Check if IP is suspicious
   */
  async checkIpReputation(
    ip: string
  ): Promise<{
    isSuspicious: boolean;
    reason?: string;
    signupsToday: number;
  }> {
    try {
      if (!ip || ip === "unknown") {
        return {
          isSuspicious: true,
          reason: "unknown_ip",
          signupsToday: 0,
        };
      }

      // Check signups from this IP today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const signupsToday = await this.eventsService.getEventCountByIp(
        ip,
        "signup",
        today
      );

      const isSuspicious = signupsToday >= antifraudRules.sameIpThreshold;

      return {
        isSuspicious,
        reason: isSuspicious
          ? `${signupsToday} signups from same IP today`
          : undefined,
        signupsToday,
      };
    } catch (error) {
      console.error("Error checking IP reputation:", error);
      return {
        isSuspicious: false,
        signupsToday: 0,
      };
    }
  }

  /**
   * Validate email domain
   */
  async validateEmail(
    email: string
  ): Promise<{
    isValid: boolean;
    isDisposable: boolean;
  }> {
    try {
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);

      if (!isValid) {
        return { isValid: false, isDisposable: false };
      }

      // Check if disposable
      const disposable = isDisposableEmail(email);

      return {
        isValid: true,
        isDisposable: disposable,
      };
    } catch (error) {
      console.error("Error validating email:", error);
      return { isValid: true, isDisposable: false };
    }
  }

  /**
   * Check fingerprint usage
   */
  async checkFingerprint(
    fingerprint: string
  ): Promise<{
    isSuspicious: boolean;
    usageCount: number;
  }> {
    try {
      // Check signups from this fingerprint in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const usageCount = await this.eventsService.getEventCountByFingerprint(
        fingerprint,
        "signup",
        sevenDaysAgo
      );

      const isSuspicious =
        usageCount >= antifraudRules.sameFingerprintThreshold;

      return {
        isSuspicious,
        usageCount,
      };
    } catch (error) {
      console.error("Error checking fingerprint:", error);
      return {
        isSuspicious: false,
        usageCount: 0,
      };
    }
  }

  /**
   * Validate referral timing
   */
  async validateTiming(
    referralId: string
  ): Promise<{
    isValid: boolean;
    reason?: string;
    timeBetweenSeconds?: number;
  }> {
    try {
      // Get time between landing and signup
      const timeBetween = await this.eventsService.getTimeBetweenEvents(
        referralId,
        "landing",
        "signup"
      );

      if (timeBetween === null) {
        // No timing data available
        return { isValid: true };
      }

      // Check if too fast (bot)
      if (timeBetween < antifraudRules.minTimeBetweenLandingAndSignup) {
        return {
          isValid: false,
          reason: "signup_too_fast",
          timeBetweenSeconds: timeBetween,
        };
      }

      // Check if too slow (expired cookie)
      if (timeBetween > antifraudRules.maxTimeBetweenLandingAndSignup) {
        return {
          isValid: false,
          reason: "signup_too_slow",
          timeBetweenSeconds: timeBetween,
        };
      }

      return { isValid: true, timeBetweenSeconds: timeBetween };
    } catch (error) {
      console.error("Error validating timing:", error);
      return { isValid: true };
    }
  }

  /**
   * Block user from creating referrals
   */
  async blockUser(userId: number, reason: string): Promise<void> {
    try {
      // For now, we'll log this. In production, you might want to add a blocklist table
      console.warn(`User ${userId} blocked from referrals: ${reason}`);

      // Cancel all pending referrals from this user
      await db
        .update(referrals)
        .set({ status: "cancelled" })
        .where(
          and(eq(referrals.referrerId, userId), eq(referrals.status, "pending"))
        );
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  }

  /**
   * Get fraud statistics for admin dashboard
   */
  async getFraudStats(): Promise<{
    blockedReferrals: number;
    suspiciousPatterns: number;
    falsePositiveRate: number;
  }> {
    try {
      // Count cancelled referrals (blocked as fraud)
      const blockedReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.status, "cancelled"));

      // For now, return basic stats
      // In production, you'd track more detailed metrics
      return {
        blockedReferrals: blockedReferrals.length,
        suspiciousPatterns: 0,
        falsePositiveRate: 0,
      };
    } catch (error) {
      console.error("Error getting fraud stats:", error);
      return {
        blockedReferrals: 0,
        suspiciousPatterns: 0,
        falsePositiveRate: 0,
      };
    }
  }

  /**
   * Check if user can create more referrals (rate limiting)
   */
  async canCreateReferral(
    userId: number
  ): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: Date;
  }> {
    try {
      // Check pending referrals count
      const pendingReferrals = await db
        .select()
        .from(referrals)
        .where(
          and(eq(referrals.referrerId, userId), eq(referrals.status, "pending"))
        );

      if (pendingReferrals.length >= antifraudRules.maxPendingReferrals) {
        return {
          allowed: false,
          reason: "max_pending_referrals_reached",
        };
      }

      // Check daily referral creation limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayReferrals = await db
        .select()
        .from(referrals)
        .where(
          and(eq(referrals.referrerId, userId), gte(referrals.createdAt, today))
        );

      if (todayReferrals.length >= antifraudRules.dailyInviteCap) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
          allowed: false,
          reason: "daily_invite_limit_reached",
          retryAfter: tomorrow,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking referral creation limit:", error);
      return { allowed: true }; // Fail open
    }
  }
}