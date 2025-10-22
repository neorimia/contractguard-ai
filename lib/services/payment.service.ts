/**
 * Payment Service
 * Handles instant credits payment operations and verification
 * Provides helper functions for instant credits management
 */

import { db } from "@/db";
import { purchases, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface InstantCreditsLimitsResult {
  canPurchase: boolean;
  reason?: string;
  remainingPurchases?: number;
}

export class PaymentService {
  /**
   * Check if user or guest has reached instant credits purchase limits
   * @param userId - User ID (null for guest)
   * @param guestSessionId - Guest session ID (null for registered user)
   * @returns Whether the user can make another purchase
   */
  async checkInstantCreditsLimits(
    userId?: number,
    guestSessionId?: string
  ): Promise<InstantCreditsLimitsResult> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (userId) {
        // Check registered user limits
        const recentPurchases = await db
          .select({ count: sql<number>`count(*)` })
          .from(purchases)
          .where(
            sql`${purchases.userId} = ${userId} AND ${purchases.type} = 'instant_credits' AND ${purchases.createdAt} > ${oneDayAgo}`
          );

        const purchaseCount = recentPurchases[0]?.count || 0;

        // Allow up to 10 instant credits purchases per day per user
        if (purchaseCount >= 10) {
          return {
            canPurchase: false,
            reason: "Daily instant credits limit reached",
            remainingPurchases: 0,
          };
        }

        return {
          canPurchase: true,
          remainingPurchases: 10 - purchaseCount,
        };
      } else if (guestSessionId) {
        // Check guest session limits
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const recentPurchases = await db
          .select({ count: sql<number>`count(*)` })
          .from(purchases)
          .where(
            sql`${purchases.guestSessionId} = ${guestSessionId} AND ${purchases.type} = 'instant_credits' AND ${purchases.createdAt} > ${oneHourAgo}`
          );

        const purchaseCount = recentPurchases[0]?.count || 0;

        // Allow up to 3 instant credits purchases per hour per guest session
        if (purchaseCount >= 3) {
          return {
            canPurchase: false,
            reason: "Hourly instant credits limit reached for guest session",
            remainingPurchases: 0,
          };
        }

        return {
          canPurchase: true,
          remainingPurchases: 3 - purchaseCount,
        };
      }

      return {
        canPurchase: false,
        reason: "No user or guest session provided",
      };
    } catch (error) {
      console.error("Error checking instant credits limits:", error);
      console.warn("Failed to check instant credits limits, allowing purchase");
      return { canPurchase: true };
    }
  }

  /**
   * Add instant credits to a user's account
   * @param userId - User ID
   * @param credits - Number of credits to add
   * @returns Updated user object
   */
  async addInstantCredits(
    userId: number,
    credits: number
  ): Promise<{ success: boolean; newBalance?: number }> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          instantCredits: sql`${users.instantCredits} + ${credits}`,
        })
        .where(eq(users.id, userId))
        .returning({ instantCredits: users.instantCredits });

      console.log(
        `✅ Added ${credits} instant credits to user ${userId}. New balance: ${updatedUser.instantCredits}`
      );

      return {
        success: true,
        newBalance: updatedUser.instantCredits || 0,
      };
    } catch (error) {
      console.error("Error adding instant credits:", error);
      return { success: false };
    }
  }

  /**
   * Add instant credits to a guest user's account
   * @param guestSessionId - Guest session ID
   * @param credits - Number of credits to add
   * @returns Success status
   */
  async addInstantCreditsToGuest(
    guestSessionId: string,
    credits: number
  ): Promise<{ success: boolean; newBalance?: number }> {
    try {
      // Find or create guest user
      let guestUser = await db.query.users.findFirst({
        where: eq(users.guestSessionId, guestSessionId),
      });

      if (!guestUser) {
        // Create guest user
        const [newGuestUser] = await db
          .insert(users)
          .values({
            stackUserId: `guest-${guestSessionId}`,
            email: `guest-${guestSessionId}@contractguard.ai`,
            displayName: "Guest User",
            tier: "free",
            accountType: "guest",
            instantCredits: credits,
          })
          .returning();

        console.log(
          `✅ Created guest user and added ${credits} instant credits. New balance: ${newGuestUser.instantCredits}`
        );

        return {
          success: true,
          newBalance: newGuestUser.instantCredits || 0,
        };
      } else {
        // Update existing guest user
        const [updatedUser] = await db
          .update(users)
          .set({
            instantCredits: sql`${users.instantCredits} + ${credits}`,
          })
          .where(eq(users.id, guestUser.id))
          .returning({ instantCredits: users.instantCredits });

        console.log(
          `✅ Added ${credits} instant credits to guest user ${guestUser.id}. New balance: ${updatedUser.instantCredits}`
        );

        return {
          success: true,
          newBalance: updatedUser.instantCredits || 0,
        };
      }
    } catch (error) {
      console.error("Error adding instant credits to guest:", error);
      return { success: false };
    }
  }
}

export const paymentService = new PaymentService();
