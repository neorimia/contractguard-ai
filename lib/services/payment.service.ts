/**
 * Payment Service
 *
 * Handles instant report payment operations and verification
 * Provides helper functions for instant report access, creation, and management
 */

import { db } from "@/db";
import { instantReports, purchases, users } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { type InstantReport, type NewInstantReport } from "@/db/schema";
import { ErrorFactory } from "@/lib/utils/error-handler";

export interface InstantReportAccessResult {
  hasAccess: boolean;
  instantReport?: InstantReport;
  expiresAt?: Date;
  reason?: string;
}

export interface CreateInstantReportParams {
  userId?: number;
  guestSessionId?: string;
  contractAddress: string;
  chain: string;
  purchaseId: string;
  amount: number;
  expiresInHours?: number;
}

export interface VerifyInstantReportParams {
  userId?: number;
  guestSessionId?: string;
  contractAddress: string;
  chain: string;
}

export class PaymentService {
  constructor() {}

  /**
   * Verify if a user or guest session has access to an instant report
   * Checks for active, non-expired instant report purchases
   */
  async verifyInstantReportAccess({
    userId,
    guestSessionId,
    contractAddress,
    chain,
  }: VerifyInstantReportParams): Promise<InstantReportAccessResult> {
    try {
      if (!userId && !guestSessionId) {
        return {
          hasAccess: false,
          reason: "No user ID or guest session ID provided",
        };
      }

      // Build the where condition based on available identifiers
      const whereConditions = [
        eq(instantReports.contractAddress, contractAddress.toLowerCase()),
        eq(instantReports.chain, chain),
        eq(instantReports.isActive, true),
        gt(instantReports.expiresAt, new Date()), // Not expired
      ];

      if (userId) {
        whereConditions.push(eq(instantReports.userId, userId));
      }

      if (guestSessionId) {
        whereConditions.push(eq(instantReports.guestSessionId, guestSessionId));
      }

      // Query for active instant report
      const [instantReport] = await db
        .select()
        .from(instantReports)
        .where(and(...whereConditions))
        .limit(1);

      if (!instantReport) {
        return {
          hasAccess: false,
          reason: userId
            ? "No active instant report found for this contract"
            : "No active instant report found for this guest session",
        };
      }

      // Double-check expiration (defensive programming)
      const now = new Date();
      const expiresAt = new Date(instantReport.expiresAt);

      if (expiresAt <= now) {
        // Update the record to inactive if expired
        await this.deactivateInstantReport(instantReport.id);

        return {
          hasAccess: false,
          reason: "Instant report access has expired",
          expiresAt,
        };
      }

      return {
        hasAccess: true,
        instantReport,
        expiresAt,
      };
    } catch (error) {
      console.error("Error verifying instant report access:", error);
      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Create a new instant report record
   * Used when payment is completed and instant report access is granted
   */
  async createInstantReport({
    userId,
    guestSessionId,
    contractAddress,
    chain,
    purchaseId,
    amount,
    expiresInHours = 24,
  }: CreateInstantReportParams): Promise<InstantReport> {
    try {
      // Validate inputs
      if (!contractAddress || !chain || !purchaseId || !amount) {
        throw ErrorFactory.missingParameters([
          "contractAddress",
          "chain",
          "purchaseId",
          "amount",
        ]);
      }

      if (!userId && !guestSessionId) {
        throw ErrorFactory.missingParameters(["userId or guestSessionId"]);
      }

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Check if instant report already exists for this purchase
      const [existingReport] = await db
        .select()
        .from(instantReports)
        .where(eq(instantReports.purchaseId, purchaseId))
        .limit(1);

      if (existingReport) {
        console.log(`Instant report already exists for purchase ${purchaseId}`);
        return existingReport;
      }

      // Create new instant report record
      const [newInstantReport] = await db
        .insert(instantReports)
        .values({
          userId: userId || null,
          guestSessionId: guestSessionId || null,
          contractAddress: contractAddress.toLowerCase(),
          chain: chain.toLowerCase(),
          purchaseId,
          amount,
          expiresAt,
          isActive: true,
          metadata: {},
        })
        .returning();

      console.log(
        `✅ Created instant report ${newInstantReport.id} for contract ${contractAddress} (expires: ${expiresAt.toISOString()})`
      );

      return newInstantReport;
    } catch (error) {
      console.error("Error creating instant report:", error);

      if (
        error instanceof Error &&
        error.message.includes("Missing required")
      ) {
        throw error;
      }

      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get instant report details by ID or by contract info
   */
  async getInstantReport(
    params:
      | { id: string }
      | {
          userId?: number;
          guestSessionId?: string;
          contractAddress: string;
          chain: string;
        }
  ): Promise<InstantReport | null> {
    try {
      if ("id" in params) {
        // Get by ID
        const [instantReport] = await db
          .select()
          .from(instantReports)
          .where(eq(instantReports.id, params.id))
          .limit(1);

        return instantReport || null;
      } else {
        // Get by contract info and user/session
        const { userId, guestSessionId, contractAddress, chain } = params;

        if (!userId && !guestSessionId) {
          throw ErrorFactory.missingParameters(["userId or guestSessionId"]);
        }

        const whereConditions = [
          eq(instantReports.contractAddress, contractAddress.toLowerCase()),
          eq(instantReports.chain, chain.toLowerCase()),
        ];

        if (userId) {
          whereConditions.push(eq(instantReports.userId, userId));
        }

        if (guestSessionId) {
          whereConditions.push(
            eq(instantReports.guestSessionId, guestSessionId)
          );
        }

        const [instantReport] = await db
          .select()
          .from(instantReports)
          .where(and(...whereConditions))
          .orderBy(instantReports.createdAt) // Get the most recent one
          .limit(1);

        return instantReport || null;
      }
    } catch (error) {
      console.error("Error getting instant report:", error);

      if (error instanceof Error && error.message.includes("Missing")) {
        throw error;
      }

      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get instant report by purchase ID
   */
  async getInstantReportByPurchaseId(
    purchaseId: string
  ): Promise<InstantReport | null> {
    try {
      const [instantReport] = await db
        .select()
        .from(instantReports)
        .where(eq(instantReports.purchaseId, purchaseId))
        .limit(1);

      return instantReport || null;
    } catch (error) {
      console.error("Error getting instant report by purchase ID:", error);
      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Update instant report status (activate/deactivate)
   */
  async updateInstantReportStatus(
    id: string,
    isActive: boolean
  ): Promise<InstantReport | null> {
    try {
      const [updatedReport] = await db
        .update(instantReports)
        .set({ isActive })
        .where(eq(instantReports.id, id))
        .returning();

      console.log(
        `Updated instant report ${id} status to ${isActive ? "active" : "inactive"}`
      );

      return updatedReport || null;
    } catch (error) {
      console.error("Error updating instant report status:", error);
      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Deactivate an instant report (mark as inactive)
   */
  async deactivateInstantReport(id: string): Promise<boolean> {
    try {
      const result = await this.updateInstantReportStatus(id, false);
      return result !== null;
    } catch (error) {
      console.error("Error deactivating instant report:", error);
      return false;
    }
  }

  /**
   * Clean up expired instant reports
   * Can be called periodically to mark expired reports as inactive
   */
  async cleanupExpiredInstantReports(): Promise<number> {
    try {
      const now = new Date();

      const updatedReports = await db
        .update(instantReports)
        .set({ isActive: false })
        .where(
          and(
            eq(instantReports.isActive, true),
            // Using raw SQL for date comparison
            sql`${instantReports.expiresAt} < ${now.toISOString()}`
          )
        )
        .returning({ id: instantReports.id });

      const cleanedCount = updatedReports.length;

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired instant reports`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("Error cleaning up expired instant reports:", error);
      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Get instant report statistics for a user
   */
  async getInstantReportStats(userId: number): Promise<{
    totalPurchased: number;
    activeReports: number;
    expiredReports: number;
    totalSpent: number; // in cents
  }> {
    try {
      const userReports = await db
        .select()
        .from(instantReports)
        .where(eq(instantReports.userId, userId));

      const now = new Date();

      const stats = userReports.reduce(
        (acc, report) => {
          acc.totalPurchased++;
          acc.totalSpent += report.amount;

          const expiresAt = new Date(report.expiresAt);
          if (report.isActive && expiresAt > now) {
            acc.activeReports++;
          } else if (expiresAt <= now) {
            acc.expiredReports++;
          }

          return acc;
        },
        {
          totalPurchased: 0,
          activeReports: 0,
          expiredReports: 0,
          totalSpent: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error("Error getting instant report stats:", error);
      throw ErrorFactory.databaseError(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Check if user or guest has reached instant report purchase limits
   * This could be expanded to implement rate limiting
   */
  async checkInstantReportLimits(
    userId?: number,
    guestSessionId?: string
  ): Promise<{
    canPurchase: boolean;
    reason?: string;
    limitInfo?: {
      recentPurchases: number;
      maxAllowed: number;
      resetTime?: Date;
    };
  }> {
    try {
      // For now, implement basic checks
      // This can be expanded with more sophisticated rate limiting

      if (userId) {
        // Check user's recent purchases (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const recentPurchases = await db
          .select()
          .from(instantReports)
          .where(
            and(
              eq(instantReports.userId, userId),
              gt(instantReports.createdAt, oneDayAgo)
            )
          );

        // Allow up to 10 instant reports per day per user
        const maxDaily = 10;

        if (recentPurchases.length >= maxDaily) {
          return {
            canPurchase: false,
            reason: "Daily instant report limit reached",
            limitInfo: {
              recentPurchases: recentPurchases.length,
              maxAllowed: maxDaily,
              resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
            },
          };
        }
      }

      if (guestSessionId) {
        // Check guest session's recent purchases
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const recentPurchases = await db
          .select()
          .from(instantReports)
          .where(
            and(
              eq(instantReports.guestSessionId, guestSessionId),
              gt(instantReports.createdAt, oneHourAgo)
            )
          );

        // Allow up to 3 instant reports per hour per guest session
        const maxHourly = 3;

        if (recentPurchases.length >= maxHourly) {
          const resetTime = new Date();
          resetTime.setHours(resetTime.getHours() + 1);

          return {
            canPurchase: false,
            reason: "Hourly instant report limit reached for guest session",
            limitInfo: {
              recentPurchases: recentPurchases.length,
              maxAllowed: maxHourly,
              resetTime,
            },
          };
        }
      }

      return { canPurchase: true };
    } catch (error) {
      console.error("Error checking instant report limits:", error);

      // Fail open - allow purchase if limit check fails
      console.warn("Failed to check instant report limits, allowing purchase");
      return { canPurchase: true };
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
