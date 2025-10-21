// lib/utils/report-access.ts
/**
 * Report Access Control Utilities
 * Handles determination of report access levels and data transformation
 */

import { db } from "@/db";
import {
  instantReports,
  users,
  User,
  type CryptoAudit,
  type RiskFlag,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  ReportAccessLevel,
  ReportAccessStatus,
  SummaryReportData,
  FullReportData,
  ReportResponse,
} from "@/lib/types/report-types";

/**
 * Determine report access level for a user or session
 *
 * Priority hierarchy:
 * 1. Pro/Team subscription → full access
 * 2. Valid instant report purchase → full access (24h)
 * 3. Free tier / Anonymous → summary only
 *
 * @param userId - App user ID (nullable for anonymous)
 * @param guestSessionId - Anonymous session ID (nullable for logged-in users)
 * @param contractAddress - Contract being accessed
 * @param chain - Blockchain network
 * @returns Report access status with level and type
 */
export async function determineReportAccess(
  userId: number | null,
  guestSessionId: string | null,
  contractAddress: string,
  chain: string
): Promise<ReportAccessStatus> {
  // Case 1: Logged-in user
  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        hasAccess: false,
        accessLevel: "summary",
        accessType: "free",
        reason: "User not found",
      };
    }

    // Check subscription tier
    if (user.tier === "pro" || user.tier === "team") {
      return {
        hasAccess: true,
        accessLevel: "full",
        accessType: user.tier,
        userId,
      };
    }

    // Check for valid instant report purchase
    const instantReport = await db.query.instantReports.findFirst({
      where: and(
        eq(instantReports.userId, userId),
        eq(instantReports.contractAddress, contractAddress.toLowerCase()),
        eq(instantReports.chain, chain),
        eq(instantReports.isActive, true)
      ),
    });

    if (instantReport) {
      const now = new Date();
      const expiresAt = new Date(instantReport.expiresAt);

      if (expiresAt > now) {
        return {
          hasAccess: true,
          accessLevel: "full",
          accessType: "instant_report",
          userId,
          instantReportId: instantReport.id,
          instantReportExpiresAt: expiresAt,
        };
      }
    }

    // Check for instant credits - if user has credits, they get full access
    if (user.instantCredits && user.instantCredits > 0) {
      console.log("User has instant credits, granting full access:", {
        userId,
        instantCredits: user.instantCredits,
        accessLevel: "full",
        accessType: "instant_report",
      });
      return {
        hasAccess: true,
        accessLevel: "full",
        accessType: "instant_report",
        userId,
      };
    }

    // Default: Free tier (summary only)
    return {
      hasAccess: true,
      accessLevel: "summary",
      accessType: user.tier === "free" ? "free" : "soft",
      userId,
    };
  }

  // Case 2: Anonymous session (guest user)
  if (guestSessionId) {
    // Check for guest instant report purchase
    const instantReport = await db.query.instantReports.findFirst({
      where: and(
        eq(instantReports.guestSessionId, guestSessionId),
        eq(instantReports.contractAddress, contractAddress.toLowerCase()),
        eq(instantReports.chain, chain),
        eq(instantReports.isActive, true)
      ),
    });

    if (instantReport) {
      const now = new Date();
      const expiresAt = new Date(instantReport.expiresAt);

      if (expiresAt > now) {
        return {
          hasAccess: true,
          accessLevel: "full",
          accessType: "instant_report",
          guestSessionId,
          instantReportId: instantReport.id,
          instantReportExpiresAt: expiresAt,
        };
      }
    }

    // Check for guest user with instant credits
    const guestUser = await db.query.users.findFirst({
      where: eq(users.guestSessionId, guestSessionId),
    });

    if (guestUser && guestUser.instantCredits && guestUser.instantCredits > 0) {
      return {
        hasAccess: true,
        accessLevel: "full",
        accessType: "instant_report",
        guestSessionId,
        userId: guestUser.id,
      };
    }

    // Default: Anonymous user (summary only)
    return {
      hasAccess: true,
      accessLevel: "summary",
      accessType: "anonymous",
      guestSessionId,
    };
  }

  // Case 3: No user or session (should not happen, but handle gracefully)
  return {
    hasAccess: true,
    accessLevel: "summary",
    accessType: "anonymous",
    reason: "No user session",
  };
}

/**
 * Transform audit data to summary report format
 * Shows limited information to encourage upgrade
 */
export function transformToSummaryReport(
  audit: CryptoAudit & { heuristicResults?: any }
): SummaryReportData {
  // Get top 3 most severe issues
  const flags = (audit.flags || []) as RiskFlag[];
  const sortedFlags = [...flags].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const topIssues = sortedFlags.slice(0, 3).map((flag) => ({
    severity: flag.severity,
    title: flag.title,
    description:
      flag.description.length > 100
        ? flag.description.slice(0, 100) + "..."
        : flag.description,
  }));

  return {
    contractAddress: audit.contractAddress,
    chain: audit.chain,
    isVerified: audit.isVerified || false,

    riskScore: audit.riskScore,
    riskCategory: audit.riskCategory || "unknown",
    recommendation: audit.heuristicResults?.recommendation || "CAUTION",

    topIssues,

    holderCountRange: getHolderRange(audit.holderCount),
    liquidityRange: getLiquidityRange(
      audit.liquidityUsd ? Number(audit.liquidityUsd) : null
    ),
    deployedAge: calculateTokenAge(audit.metadata?.deployDate),

    totalIssuesCount: flags.length,
    confidence: audit.confidence || 0,

    accessLevel: "summary",
    upgradeRequired: true,
    upgradeOptions: {
      instantReport: {
        price: 499, // $4.99 in cents
        description: "One-time access to full report",
        validFor: "24 hours",
      },
      proSubscription: {
        price: 2900, // $29/month in cents
        description: "Unlimited scans and full reports",
        features: [
          "Unlimited contract scans",
          "Full detailed reports",
          "Historical analysis",
          "Priority support",
        ],
      },
    },
  };
}

/**
 * Transform audit data to full report format
 * Complete data for paying users
 */
export function transformToFullReport(
  audit: CryptoAudit & {
    recommendation?: string;
    heuristicResults?: any;
    holderData?: any;
    liquidityData?: any;
  },
  accessType: "pro" | "team" | "instant_report",
  expiresAt?: Date
): FullReportData {
  return {
    contractAddress: audit.contractAddress,
    chain: audit.chain,
    isVerified: audit.isVerified || false,

    riskScore: audit.riskScore,
    riskCategory: audit.riskCategory || "unknown",
    recommendation: audit.recommendation || "CAUTION",
    confidence: audit.confidence || 0,

    flags: (audit.flags || []) as RiskFlag[],

    holderCount: audit.holderCount || null,
    topHolderConcentration: audit.topHolderConcentration
      ? Number(audit.topHolderConcentration)
      : null,
    liquidityUsd: audit.liquidityUsd ? Number(audit.liquidityUsd) : null,

    metadata: audit.metadata || {
      deployer: "Unknown",
      deployDate: new Date().toISOString(),
    },

    holderData: audit.holderData,
    liquidityData: audit.liquidityData,
    heuristicResults: audit.heuristicResults,

    createdAt: audit.createdAt || new Date(),
    expiresAt:
      accessType === "instant_report"
        ? expiresAt
        : audit.expiresAt || undefined,

    accessLevel: "full",
    accessType,
  };
}

/**
 * Helper: Convert exact holder count to range
 */
export function getHolderRange(holderCount: number | null | undefined): string {
  if (!holderCount || holderCount === 0) return "Unknown";
  if (holderCount < 10) return "< 10";
  if (holderCount < 50) return "10-50";
  if (holderCount < 100) return "50-100";
  if (holderCount < 500) return "100-500";
  if (holderCount < 1000) return "500-1,000";
  if (holderCount < 5000) return "1,000-5,000";
  if (holderCount < 10000) return "5,000-10,000";
  return "10,000+";
}

/**
 * Helper: Convert exact liquidity to range
 */
export function getLiquidityRange(
  liquidityUsd: number | null | undefined
): string {
  if (!liquidityUsd || liquidityUsd === 0) return "Unknown";
  if (liquidityUsd < 1000) return "< $1K";
  if (liquidityUsd < 10000) return "$1K-$10K";
  if (liquidityUsd < 100000) return "$10K-$100K";
  if (liquidityUsd < 500000) return "$100K-$500K";
  if (liquidityUsd < 1000000) return "$500K-$1M";
  return "$1M+";
}

/**
 * Helper: Calculate token age from deploy date
 */
export function calculateTokenAge(
  deployDate: string | null | undefined
): string {
  if (!deployDate) return "Unknown";

  try {
    const deployed = new Date(deployDate);
    const now = new Date();
    const ageMs = now.getTime() - deployed.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    if (ageDays < 1) return "< 1 day";
    if (ageDays < 7) return "< 1 week";
    if (ageDays < 30) return "1-4 weeks";
    if (ageDays < 90) return "1-3 months";
    if (ageDays < 180) return "3-6 months";
    if (ageDays < 365) return "6-12 months";
    return "1+ year";
  } catch {
    return "Unknown";
  }
}

/**
 * Helper: Get severity score for sorting
 */
export function getSeverityScore(
  severity: "low" | "medium" | "high" | "critical"
): number {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return scores[severity] || 0;
}
