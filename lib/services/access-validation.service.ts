/**
 * Access Validation Service
 *
 * Server-side validation for scan access with priority logic:
 * 1. Pro/Team subscription → unlimited access
 * 2. Instant credits → deduct one credit
 * 3. Free tier → daily limit check
 */

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type AccessType = "pro" | "team" | "instant_credit" | "free" | "none";

export interface AccessValidationResult {
  hasAccess: boolean;
  accessType: AccessType;
  scansRemaining: number;
  instantCredits: number;
  reason?: string;
}

export class AccessValidationService {
  /**
   * Validate if user has access to perform a scan
   * @param userId - Database user ID
   * @returns Access validation result with type and remaining scans
   */
  async validateAccess(userId: number): Promise<AccessValidationResult> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return {
          hasAccess: false,
          accessType: "none",
          scansRemaining: 0,
          instantCredits: 0,
          reason: "User not found",
        };
      }

      // Priority 1: Check for Pro/Team subscription
      if (user.subscriptionTier === "pro" || user.subscriptionTier === "team") {
        return {
          hasAccess: true,
          accessType: user.subscriptionTier as "pro" | "team",
          scansRemaining: -1, // -1 indicates unlimited
          instantCredits: user.instantCredits || 0,
        };
      }

      // Priority 2: Check for instant credits
      const instantCredits = user.instantCredits || 0;
      if (instantCredits > 0) {
        return {
          hasAccess: true,
          accessType: "instant_credit",
          scansRemaining: instantCredits,
          instantCredits,
        };
      }

      // Priority 3: Check free tier daily limit
      const now = new Date();
      const resetAt = user.scansResetAt ? new Date(user.scansResetAt) : null;

      // Reset daily counter if needed
      if (!resetAt || now >= resetAt) {
        await this.resetDailyScans(userId);
        return {
          hasAccess: true,
          accessType: "free",
          scansRemaining: 3, // Default free tier limit
          instantCredits: 0,
        };
      }

      // Check if free scans available
      const scansUsed = user.scansToday || 0;
      const freeLimit = 3; // Free tier daily limit
      const scansRemaining = Math.max(0, freeLimit - scansUsed);

      if (scansRemaining > 0) {
        return {
          hasAccess: true,
          accessType: "free",
          scansRemaining,
          instantCredits: 0,
        };
      }

      // No access available
      return {
        hasAccess: false,
        accessType: "none",
        scansRemaining: 0,
        instantCredits: 0,
        reason: "Daily limit reached. Purchase instant reports or upgrade to Pro.",
      };
    } catch (error) {
      console.error("Access validation error:", error);
      throw new Error("Failed to validate access");
    }
  }

  /**
   * Consume one scan from user's available access
   * Applies priority logic: instant credits → free tier limit
   * (Pro/Team subscriptions are unlimited, no deduction needed)
   *
   * @param userId - Database user ID
   * @param accessType - The access type being used (from validateAccess)
   * @returns True if consumption successful
   */
  async consumeScan(userId: number, accessType: AccessType): Promise<boolean> {
    try {
      if (accessType === "pro" || accessType === "team") {
        // Unlimited subscription, no deduction needed
        return true;
      }

      if (accessType === "instant_credit") {
        // Deduct one instant credit
        const [result] = await db
          .update(users)
          .set({
            instantCredits: sql`GREATEST(${users.instantCredits} - 1, 0)`,
            instantCreditsUsedToday: sql`${users.instantCreditsUsedToday} + 1`,
          })
          .where(eq(users.id, userId))
          .returning({ updatedCredits: users.instantCredits });

        return result !== undefined;
      }

      if (accessType === "free") {
        // Increment free tier counter
        await db
          .update(users)
          .set({
            scansToday: sql`${users.scansToday} + 1`,
          })
          .where(eq(users.id, userId));

        return true;
      }

      return false;
    } catch (error) {
      console.error("Scan consumption error:", error);
      throw new Error("Failed to consume scan");
    }
  }

  /**
   * Reset daily scan counter for free tier users
   * @param userId - Database user ID
   */
  private async resetDailyScans(userId: number): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await db
      .update(users)
      .set({
        scansToday: 0,
        scansResetAt: tomorrow,
        instantCreditsUsedToday: 0, // Also reset instant credit counter
      })
      .where(eq(users.id, userId));
  }

  /**
   * Get user's current access status without consuming
   * Useful for UI display
   *
   * @param userId - Database user ID
   * @returns Current access status
   */
  async getAccessStatus(userId: number): Promise<AccessValidationResult> {
    return this.validateAccess(userId);
  }

  /**
   * Check if guest user has access via guest session
   * @param guestSessionId - Guest session UUID
   * @returns Access validation result
   */
  async validateGuestAccess(
    guestSessionId: string
  ): Promise<AccessValidationResult> {
    try {
      const [guestUser] = await db
        .select()
        .from(users)
        .where(eq(users.guestSessionId, guestSessionId))
        .limit(1);

      if (!guestUser) {
        return {
          hasAccess: false,
          accessType: "none",
          scansRemaining: 0,
          instantCredits: 0,
          reason: "Guest session not found",
        };
      }

      // Guest users can only use instant credits (no free tier)
      const instantCredits = guestUser.instantCredits || 0;
      if (instantCredits > 0) {
        return {
          hasAccess: true,
          accessType: "instant_credit",
          scansRemaining: instantCredits,
          instantCredits,
        };
      }

      return {
        hasAccess: false,
        accessType: "none",
        scansRemaining: 0,
        instantCredits: 0,
        reason: "No credits available. Purchase instant reports to continue.",
      };
    } catch (error) {
      console.error("Guest access validation error:", error);
      throw new Error("Failed to validate guest access");
    }
  }
}

export const accessValidationService = new AccessValidationService();