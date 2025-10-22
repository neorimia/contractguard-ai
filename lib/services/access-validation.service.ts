/**
 * Access Validation Service
 *
 * Server-side validation for scan access with priority logic:
 * Priority Order (Highest to Lowest):
 * 1. Pro/Team subscription → unlimited access
 * 2. Instant credits → deduct one credit
 * 3. Soft account → free tier (3/day)
 * 4. Free account → free tier (3/day)
 * 5. Anonymous → cookie-tracked (3 total)
 *
 * Account Type Progression:
 * anonymous → soft → full
 */

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  getAnonymousScanCount,
  incrementAnonymousScanCount,
} from "@/lib/middleware/session-tracking";

export type AccessType =
  | "pro"
  | "team"
  | "instant_credit"
  | "free"
  | "soft"
  | "anonymous"
  | "none";

export type AccountType = "anonymous" | "soft" | "full";

export interface AccessValidationResult {
  hasAccess: boolean;
  accessType: AccessType;
  scansRemaining: number;
  instantCredits: number;
  accountType?: AccountType;
  reason?: string;
  upgradePrompt?: string;
  resetAt?: Date;
}

export class AccessValidationService {
  /**
   * Validate anonymous user access (cookie-based, no account)
   * @param sessionId - Anonymous session ID from cookie
   * @returns Access validation result
   */
  async validateAnonymousAccess(
    sessionId: string
  ): Promise<AccessValidationResult> {
    const scanCount = await getAnonymousScanCount(sessionId);
    const scansRemaining = Math.max(0, 3 - scanCount);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "anonymous",
        scansRemaining,
        instantCredits: 0,
        accountType: "anonymous",
        upgradePrompt:
          scanCount >= 2 ? "Create account to save scans" : undefined,
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: "anonymous",
      reason: "Anonymous scan limit reached",
      upgradePrompt: "Create a free account to continue scanning",
    };
  }

  /**
   * Validate soft account access (email-only, no full signup)
   * Soft accounts follow same rules as free tier (3 scans/day)
   * @param userId - Database user ID
   * @returns Access validation result
   */
  async validateSoftAccess(userId: number): Promise<AccessValidationResult> {
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

    // Soft accounts follow free tier rules
    const now = new Date();
    const resetAt = user.scansResetAt ? new Date(user.scansResetAt) : null;

    if (!resetAt || now >= resetAt) {
      await this.resetDailyScans(userId);
      return {
        hasAccess: true,
        accessType: "soft",
        scansRemaining: 3,
        instantCredits: 0,
        accountType: "soft",
        upgradePrompt: "Complete account setup for more features",
      };
    }

    const scansUsed = user.scansToday || 0;
    const scansRemaining = Math.max(0, 3 - scansUsed);

    if (scansRemaining > 0) {
      return {
        hasAccess: true,
        accessType: "soft",
        scansRemaining,
        instantCredits: 0,
        accountType: "soft",
      };
    }

    return {
      hasAccess: false,
      accessType: "none",
      scansRemaining: 0,
      instantCredits: 0,
      accountType: "soft",
      reason: "Daily limit reached",
      upgradePrompt: "Complete account setup or purchase instant reports",
    };
  }

  /**
   * Main access validation with support for all account types
   * @param userId - Optional database user ID (null for anonymous)
   * @param anonymousSessionId - Optional anonymous session ID
   * @returns Access validation result
   */
  async validateAccess(
    userId?: number,
    anonymousSessionId?: string
  ): Promise<AccessValidationResult> {
    try {
      // Handle anonymous user (no userId)
      if (!userId && anonymousSessionId) {
        return this.validateAnonymousAccess(anonymousSessionId);
      }

      // Handle authenticated users
      if (!userId) {
        return {
          hasAccess: false,
          accessType: "none",
          scansRemaining: 0,
          instantCredits: 0,
          reason: "Authentication required",
        };
      }

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

      // Soft account - delegate to soft validation
      if (user.accountType === "soft") {
        return this.validateSoftAccess(userId);
      }

      // Priority 1: Check for Pro/Team subscription
      if (
        user.tier === "pro" ||
        user.tier === "enterprise" ||
        user.tier === "team"
      ) {
        // Check daily scan limit for Pro (100/day), Team/Enterprise unlimited
        if (user.tier === "pro") {
          const now = new Date();
          const resetAt = user.scansResetAt
            ? new Date(user.scansResetAt)
            : null;

          // Reset daily counter if needed
          if (!resetAt || now >= resetAt) {
            await this.resetDailyScans(userId);
            return {
              hasAccess: true,
              accessType: "pro",
              scansRemaining: 100, // Pro tier limit
              instantCredits: user.instantCredits || 0,
              accountType: (user.accountType as AccountType) || "full",
              resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day reset
            };
          }

          // Check if Pro scans available
          const scansUsed = user.scansToday || 0;
          const proLimit = 100; // Pro tier daily limit
          const scansRemaining = Math.max(0, proLimit - scansUsed);

          if (scansRemaining > 0) {
            return {
              hasAccess: true,
              accessType: "pro",
              scansRemaining,
              instantCredits: user.instantCredits || 0,
              accountType: (user.accountType as AccountType) || "full",
              resetAt: resetAt,
            };
          }

          // Pro limit reached
          return {
            hasAccess: false,
            accessType: "pro",
            scansRemaining: 0,
            instantCredits: user.instantCredits || 0,
            accountType: (user.accountType as AccountType) || "full",
            reason:
              "Pro daily limit reached (100 scans). Upgrade to Team for unlimited.",
            resetAt: resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          };
        } else {
          // Team/Enterprise - unlimited
          return {
            hasAccess: true,
            accessType:
              user.tier === "enterprise" ? "team" : (user.tier as AccessType),
            scansRemaining: -1, // -1 indicates unlimited
            instantCredits: user.instantCredits || 0,
            accountType: (user.accountType as AccountType) || "full",
          };
        }
      }

      // Priority 2: Check for instant credits
      const instantCredits = user.instantCredits || 0;
      if (instantCredits > 0) {
        return {
          hasAccess: true,
          accessType: "instant_credit",
          scansRemaining: instantCredits,
          instantCredits,
          accountType: (user.accountType as AccountType) || "full",
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
          accountType: (user.accountType as AccountType) || "full",
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
          accountType: (user.accountType as AccountType) || "full",
        };
      }

      // No access available
      return {
        hasAccess: false,
        accessType: "none",
        scansRemaining: 0,
        instantCredits: 0,
        accountType: (user.accountType as AccountType) || "full",
        reason:
          "Daily limit reached. Purchase instant reports or upgrade to Pro.",
        resetAt: resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day reset
      };
    } catch (error) {
      console.error("Access validation error:", error);
      throw new Error("Failed to validate access");
    }
  }

  /**
   * Consume one scan from user's available access
   * Applies priority logic for all account types
   *
   * @param userId - Database user ID (null for anonymous)
   * @param accessType - The access type being used (from validateAccess)
   * @param anonymousSessionId - Optional anonymous session ID
   * @returns True if consumption successful
   */
  async consumeScan(
    userId: number | null,
    accessType: AccessType,
    anonymousSessionId?: string
  ): Promise<boolean> {
    try {
      // Handle anonymous consumption
      if (accessType === "anonymous" && anonymousSessionId) {
        await incrementAnonymousScanCount(anonymousSessionId);
        return true;
      }

      // Require userId for all other types
      if (!userId) {
        return false;
      }

      // Soft account - same as free tier
      if (accessType === "soft") {
        await db
          .update(users)
          .set({
            scansToday: sql`${users.scansToday} + 1`,
          })
          .where(eq(users.id, userId));
        return true;
      }

      // Pro/Team - track usage but don't limit
      if (accessType === "pro" || accessType === "team") {
        await db
          .update(users)
          .set({
            scansToday: sql`${users.scansToday} + 1`,
          })
          .where(eq(users.id, userId));
        return true;
      }

      // Instant credits - deduct one
      if (accessType === "instant_credit") {
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

      // Free tier - increment counter
      if (accessType === "free") {
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
   * @param anonymousSessionId - Optional anonymous session ID
   * @returns Current access status
   */
  async getAccessStatus(
    userId?: number,
    anonymousSessionId?: string
  ): Promise<AccessValidationResult> {
    return this.validateAccess(userId, anonymousSessionId);
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
