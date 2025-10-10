// lib/services/auth.service.ts
import { db } from "@/db";
import { users, type User, type NewUser } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTierLimit } from "@/lib/config/tier-limits";
import { EmailService } from "./email.service";
import { ReferralService } from "./referral.service";
import {
  getReferralCookie,
  clearReferralCookie,
} from "@/lib/utils/referral-cookies";
import { getClientInfo } from "@/lib/utils/client-info";
import crypto from "crypto";

interface UserProfile {
  displayName?: string;
  avatarUrl?: string;
}

interface ScanLimitResult {
  allowed: boolean;
  scansRemaining: number;
  resetAt: Date;
}

/**
 * AuthService - Handles integration between Stack Auth and ContractGuard
 */
export class AuthService {
  /**
   * Sync Stack Auth user to ContractGuard users table
   * Called on first login or via webhook
   */
  async syncUser(
    stackUserId: string,
    email: string,
    profile?: UserProfile,
  ): Promise<User> {
    try {
      // Check if user already exists by Stack ID
      const existingUser = await this.getUserByStackId(stackUserId);

      if (existingUser) {
        // Update profile if provided
        if (profile) {
          const [updatedUser] = await db
            .update(users)
            .set({
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.stackUserId, stackUserId))
            .returning();

          return updatedUser;
        }
        return existingUser;
      }

      // Check if user exists with this email (Stack ID might have changed)
      const userByEmail = await this.getUserByEmail(email);

      if (userByEmail) {
        // User exists but with different Stack ID - update it
        console.log("Updating Stack User ID for existing email:", {
          email,
          oldStackId: userByEmail.stackUserId,
          newStackId: stackUserId,
        });

        const [updatedUser] = await db
          .update(users)
          .set({
            stackUserId, // Update to new Stack ID
            displayName: profile?.displayName || userByEmail.displayName,
            avatarUrl: profile?.avatarUrl || userByEmail.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, email))
          .returning();

        return updatedUser;
      }

      // Create new user
      const newUser: NewUser = {
        stackUserId,
        email,
        displayName: profile?.displayName,
        avatarUrl: profile?.avatarUrl,
        tier: "free",
        scansToday: 0,
        scansResetAt: this.getNextResetTime(),
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();

      console.log("User created successfully:", {
        userId: createdUser.id,
        email: createdUser.email,
      });

      // ============================================================
      // REFERRAL SYSTEM INTEGRATION
      // Check for referral cookie and complete signup
      // ============================================================
      try {
        const referralCode = await getReferralCookie();

        if (referralCode) {
          console.log(
            `Referral signup detected for user ${createdUser.id} with code: ${referralCode}`,
          );

          const referralService = new ReferralService();
          const clientInfo = await getClientInfo();

          const result = await referralService.completeSignup({
            referralCode,
            referredUserId: createdUser.id,
            metadata: clientInfo,
          });

          if (result.success) {
            console.log(
              `Referral signup bonus applied successfully for user ${createdUser.id}`,
            );

            if (result.reward) {
              console.log(
                `Reward granted: ${result.reward.type} x${result.reward.amount}`,
              );
            }
          } else {
            console.warn(`Referral signup failed: ${result.error}`);
          }

          // Clear the referral cookie after processing
          await clearReferralCookie();
        }
      } catch (referralError) {
        // Log referral errors but don't fail user creation
        console.error("Error processing referral signup:", referralError);
      }
      // ============================================================

      if (newUser) {
        try {
          const emailService = new EmailService();
          const tierLimit = getTierLimit(createdUser.tier);

          await emailService.sendWelcomeEmail(createdUser.email, {
            displayName: createdUser.displayName || undefined,
            scansRemaining: tierLimit === -1 ? 100 : tierLimit, // Use 100 for unlimited tiers
          });
        } catch (emailError) {
          // Log but don't fail verification if email fails
          console.error("Failed to send welcome email:", emailError);
        }
      }
      return createdUser;
    } catch (error: any) {
      console.error("Error syncing user:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack,
        newUserData: {
          stackUserId,
          email,
          tier: "free",
        },
      });
      throw new Error(`Failed to sync user: ${error.message}`);
    }
  }

  /**
   * Get user by Stack Auth ID
   */
  async getUserByStackId(stackUserId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stackUserId, stackUserId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by Stack ID:", error);
      return null;
    }
  }

  /**
   * Alias for getUserByStackId (for consistency)
   */
  async getUserByStackUserId(stackUserId: string): Promise<User | null> {
    return this.getUserByStackId(stackUserId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  }

  /**
   * Update user last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  /**
   * Check if user has reached scan limit for their tier
   */
  async checkScanLimit(userId: number): Promise<ScanLimitResult> {
    try {
      const user = await this.getUserById(userId);

      if (!user) {
        return {
          allowed: false,
          scansRemaining: 0,
          resetAt: new Date(),
        };
      }

      // Check if we need to reset the counter
      if (this.shouldResetScans(user.scansResetAt)) {
        await this.resetUserScans(userId);
        user.scansToday = 0;
      }

      const tierLimit = getTierLimit(user.tier);

      // Unlimited scans for enterprise
      if (tierLimit === -1) {
        return {
          allowed: true,
          scansRemaining: -1,
          resetAt: user.scansResetAt || this.getNextResetTime(),
        };
      }

      const scansRemaining = Math.max(0, tierLimit - (user.scansToday || 0));
      const allowed = (user.scansToday || 0) < tierLimit;

      return {
        allowed,
        scansRemaining,
        resetAt: user.scansResetAt || this.getNextResetTime(),
      };
    } catch (error) {
      console.error("Error checking scan limit:", error);
      return {
        allowed: false,
        scansRemaining: 0,
        resetAt: new Date(),
      };
    }
  }

  /**
   * Increment scan count for user
   */
  async incrementScanCount(userId: number): Promise<void> {
    try {
      const user = await this.getUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Check if we need to reset first
      if (this.shouldResetScans(user.scansResetAt)) {
        await this.resetUserScans(userId);
        await db
          .update(users)
          .set({ scansToday: 1 })
          .where(eq(users.id, userId));
      } else {
        await db
          .update(users)
          .set({ scansToday: (user.scansToday || 0) + 1 })
          .where(eq(users.id, userId));
      }
    } catch (error) {
      console.error("Error incrementing scan count:", error);
      throw error;
    }
  }

  /**
   * Reset daily scan count for a specific user
   */
  async resetUserScans(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          scansToday: 0,
          scansResetAt: this.getNextResetTime(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error resetting user scans:", error);
    }
  }

  /**
   * Reset daily scan counts for all users (called by cron job)
   */
  async resetDailyScanCounts(): Promise<void> {
    try {
      await db.update(users).set({
        scansToday: 0,
        scansResetAt: this.getNextResetTime(),
      });

      console.log("Daily scan counts reset successfully");
    } catch (error) {
      console.error("Error resetting daily scan counts:", error);
      throw error;
    }
  }

  /**
   * Update user tier (for Stripe webhook integration)
   */
  async updateUserTier(
    userId: number,
    tier: string,
    subscriptionData?: {
      stripeSubscriptionId?: string;
      subscriptionStatus?: string;
    },
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          tier,
          stripeSubscriptionId: subscriptionData?.stripeSubscriptionId,
          subscriptionStatus: subscriptionData?.subscriptionStatus,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error updating user tier:", error);
      throw error;
    }
  }

  /**
   * Helper: Check if scans should be reset (past reset time)
   */
  private shouldResetScans(resetAt: Date | null): boolean {
    if (!resetAt) return true;
    return new Date() >= new Date(resetAt);
  }

  /**
   * Helper: Get next reset time (midnight UTC)
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  // ============================================================
  // Email Verification Methods
  // ============================================================

  /**
   * Generate and store email verification token
   */
  async generateVerificationToken(userId: number): Promise<string> {
    try {
      // Generate secure token (32 chars, lowercase hex)
      const token = crypto.randomBytes(16).toString("hex").toLowerCase();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store in database
      await db
        .update(users)
        .set({
          verificationToken: token,
          verificationTokenExpires: expires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return token;
    } catch (error) {
      console.error("Error generating verification token:", error);
      throw new Error("Failed to generate verification token");
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{
    success: boolean;
    error?: string;
    email?: string;
  }> {
    try {
      // Validate format
      if (!/^[a-z0-9]{32,}$/.test(token)) {
        return { success: false, error: "INVALID_FORMAT" };
      }

      // Find user by token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return { success: false, error: "TOKEN_NOT_FOUND" };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          success: false,
          error: "TOKEN_ALREADY_USED",
          email: user.email,
        };
      }

      // Check expiry
      if (
        !user.verificationTokenExpires ||
        new Date() > new Date(user.verificationTokenExpires)
      ) {
        return { success: false, error: "TOKEN_EXPIRED", email: user.email };
      }

      // Mark as verified and clear token
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`Email verified for user: ${user.email}`);

      // Send welcome email (non-blocking)
      try {
        const emailService = new EmailService();
        const tierLimit = getTierLimit(user.tier);

        await emailService.sendWelcomeEmail(user.email, {
          displayName: user.displayName || undefined,
          scansRemaining: tierLimit === -1 ? 100 : tierLimit, // Use 100 for unlimited tiers
        });
      } catch (emailError) {
        // Log but don't fail verification if email fails
        console.error("Failed to send welcome email:", emailError);
      }

      return { success: true, email: user.email };
    } catch (error) {
      console.error("Error verifying email:", error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);

      if (!user) {
        throw new Error("User not found");
      }

      if (user.emailVerified) {
        throw new Error("Email already verified");
      }

      // Generate new token
      const token = await this.generateVerificationToken(user.id);

      // Send email
      const emailService = new EmailService();
      await emailService.sendVerificationEmail(user.email, token, {
        firstName: user.displayName || undefined,
      });

      console.log(`Verification email resent to: ${user.email}`);

      return true;
    } catch (error) {
      console.error("Error resending verification email:", error);
      throw error;
    }
  }

  /**
   * Check if user email is verified
   */
  async isEmailVerified(userId: number): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return user?.emailVerified ?? false;
    } catch (error) {
      console.error("Error checking email verification:", error);
      return false;
    }
  }

  /**
   * Invalidate verification token (security cleanup)
   */
  async invalidateVerificationToken(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          verificationToken: null,
          verificationTokenExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Verification token invalidated for user ID: ${userId}`);
    } catch (error) {
      console.error("Error invalidating verification token:", error);
    }
  }

  /**
   * Get user by verification token
   */
  async getUserByVerificationToken(token: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by verification token:", error);
      return null;
    }
  }

  /**
   * Get user by Stripe customer ID
   */
  async getUserByStripeCustomerId(customerId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by Stripe customer ID:", error);
      return null;
    }
  }

  /**
   * Get user by Stripe subscription ID
   */
  async getUserBySubscriptionId(subscriptionId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeSubscriptionId, subscriptionId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error("Error fetching user by subscription ID:", error);
      return null;
    }
  }

  /**
   * Update user data
   */
  async updateUser(
    userId: number,
    data: {
      tier?: "free" | "pro" | "enterprise";
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      scansToday?: number;
      scansResetAt?: Date;
      emailVerified?: boolean;
      verificationToken?: string | null;
      verificationTokenExpires?: Date | null;
      lastLoginAt?: Date;
    },
  ): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
}
