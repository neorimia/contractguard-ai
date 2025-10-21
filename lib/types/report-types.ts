// lib/types/report-types.ts
/**
 * Report Access Types and Response Structures
 * Defines the structure of summary vs full report data for the paywall system
 */

import { RiskFlag, ContractMetadata } from "@/db/schema";

/**
 * Access levels for contract audit reports
 */
export type ReportAccessLevel =
  | "summary" // Free users, anonymous users - limited data
  | "full"; // Pro/Team users, instant report purchasers - complete data

/**
 * Summary Report Data - Limited information for free users
 * Designed to showcase value while encouraging upgrade to full report
 */
export interface SummaryReportData {
  // Basic Contract Info
  contractAddress: string;
  chain: string;
  isVerified: boolean;

  // Risk Score (always shown)
  riskScore: number; // 0-100
  riskCategory: string; // very_low, low, medium, high, critical
  recommendation: string; // BUY, CAUTION, AVOID

  // Top 3 Issues Preview (teaser)
  topIssues: Array<{
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string; // Truncated to 100 characters
  }>;

  // Basic Statistics (ranges instead of exact numbers)
  holderCountRange: string; // e.g., "100-500", "1000-5000"
  liquidityRange: string; // e.g., "<$10K", "$10K-$100K"
  deployedAge: string; // e.g., "< 1 week", "1-3 months"

  // Metadata
  totalIssuesCount: number;
  confidence: number; // Analysis confidence 0-100

  // Access control
  accessLevel: "summary";
  upgradeRequired: boolean;
  upgradeOptions: {
    instantReport: {
      price: number; // cents
      description: string;
      validFor: string; // "24 hours"
    };
    proSubscription: {
      price: number; // cents
      description: string;
      features: string[];
    };
  };
}

/**
 * Full Report Data - Complete analysis for paid users
 */
export interface FullReportData {
  // Basic Contract Info
  contractAddress: string;
  chain: string;
  isVerified: boolean;

  // Complete Risk Assessment
  riskScore: number; // 0-100
  riskCategory: string;
  recommendation: string;
  confidence: number;

  // All Risk Flags (not just top 3)
  flags: RiskFlag[];

  // Detailed Statistics
  holderCount: number | null;
  topHolderConcentration: number | null; // percentage
  liquidityUsd: number | null;

  // Contract Metadata
  metadata: ContractMetadata;

  // Extended Analysis (Phase 2 data)
  holderData?: {
    holderCount: number;
    topHolderConcentration: number;
    topHolders: Array<{
      address: string;
      balance: string;
      percentage: number;
    }>;
  };

  liquidityData?: {
    totalLiquidityUsd: number | null;
    liquidityPairs: Array<{
      dex: string;
      pairAddress: string;
      liquidityUsd: number;
      volume24h: number;
    }>;
    isLocked: boolean;
    poolCount: number;
  };

  // Heuristic Analysis Results
  heuristicResults?: {
    scores: Record<string, number>;
    details: Record<string, any>;
  };

  // Timestamps
  createdAt: Date;
  expiresAt?: Date;

  // Access control
  accessLevel: "full";
  accessType: "pro" | "team" | "instant_report";
}

/**
 * Unified Report Response
 * API returns this type with discriminated union based on accessLevel
 */
export type ReportResponse = SummaryReportData | FullReportData;

/**
 * Report Access Status
 * Result of access validation check
 */
export interface ReportAccessStatus {
  hasAccess: boolean;
  accessLevel: ReportAccessLevel;
  accessType: "free" | "pro" | "team" | "instant_report" | "soft" | "anonymous";
  userId?: number;
  guestSessionId?: string;

  // For instant reports
  instantReportId?: string;
  instantReportExpiresAt?: Date;

  // Reason for access denial
  reason?: string;
}
