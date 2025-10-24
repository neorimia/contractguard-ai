/**
 * Liquidity Pool Activity Heuristic
 *
 * Monitors liquidity pool health and activity patterns.
 * Suspicious liquidity patterns can indicate rug pull preparation.
 *
 * Risk Factors:
 * - Liquidity removal events
 * - Low liquidity relative to market cap
 * - Unlocked liquidity
 * - Single LP provider concentration
 *
 * Weight: 25 (High Priority)
 * Category: Tier 2 - Advanced Static Analysis
 */

import { BaseHeuristic } from "./base.heuristic";
import type { HeuristicResult, ContractAnalysisData } from "../types";

export class LiquidityPoolActivityHeuristic extends BaseHeuristic {
  name = "Liquidity Pool Activity";
  category = "liquidity" as const;
  weight = 25;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { liquidityData } = data;

    if (!liquidityData) {
      return {
        name: this.name,
        category: this.category,
        passed: true,
        severity: "low",
        score: 0,
        confidence: 0,
      };
    }

    const issues: string[] = [];
    let riskScore = 0;
    let severity: "low" | "medium" | "high" | "critical" = "low";

    // Check liquidity amount
    const liquidityUsd = Number(liquidityData.totalLiquidityUsd) || 0;
    if (liquidityUsd < 10000) {
      issues.push(`Very low liquidity: $${liquidityUsd.toLocaleString()}`);
      riskScore += 40;
      severity = "high";
    } else if (liquidityUsd < 50000) {
      issues.push(`Low liquidity: $${liquidityUsd.toLocaleString()}`);
      riskScore += 25;
      severity = "medium";
    }

    // Check liquidity lock status (using type assertion for extended fields)
    const extendedData = liquidityData as any;
    if (extendedData.isLocked === false) {
      issues.push("Liquidity is not locked");
      riskScore += 35;
      severity = "high";
    } else if (extendedData.lockDuration) {
      const lockDays = extendedData.lockDuration;
      if (lockDays < 90) {
        issues.push(`Short liquidity lock: ${lockDays} days`);
        riskScore += 25;
        if (severity === "low") severity = "medium";
      }
    }

    // Check LP provider concentration (using type assertion for extended fields)
    if (extendedData.lpProviders && extendedData.lpProviders.length > 0) {
      const topProviderPercentage =
        extendedData.lpProviders[0]?.percentage || 0;

      if (topProviderPercentage > 90) {
        issues.push(
          `High LP concentration: ${topProviderPercentage}% held by top provider`
        );
        riskScore += 30;
        severity = "high";
      } else if (topProviderPercentage > 75) {
        issues.push(
          `LP concentration: ${topProviderPercentage}% held by top provider`
        );
        riskScore += 20;
        if (severity === "low") severity = "medium";
      }
    }

    // Check for recent liquidity removal
    if (extendedData.recentRemoval) {
      const { amount, percentage, timestamp } = extendedData.recentRemoval;
      const daysAgo = this.getDaysSince(new Date(timestamp));

      if (percentage > 50) {
        issues.push(
          `Major liquidity removal: ${percentage}% removed ${daysAgo} days ago`
        );
        riskScore += 45;
        severity = "critical";
      } else if (percentage > 20) {
        issues.push(
          `Liquidity removal: ${percentage}% removed ${daysAgo} days ago`
        );
        riskScore += 30;
        severity = "high";
      }
    }

    // Check liquidity to market cap ratio
    if (extendedData.liquidityToMcapRatio) {
      const ratio = extendedData.liquidityToMcapRatio;

      if (ratio < 0.05) {
        issues.push(
          `Very low liquidity/mcap ratio: ${(ratio * 100).toFixed(1)}%`
        );
        riskScore += 35;
        if (severity !== "critical") severity = "high";
      } else if (ratio < 0.1) {
        issues.push(`Low liquidity/mcap ratio: ${(ratio * 100).toFixed(1)}%`);
        riskScore += 20;
        if (severity === "low") severity = "medium";
      }
    }

    // Check for multiple pools (liquidity fragmentation)
    if (extendedData.poolCount && extendedData.poolCount > 3) {
      issues.push(
        `Liquidity fragmented across ${extendedData.poolCount} pools`
      );
      riskScore += 15;
    }

    if (issues.length === 0) {
      return {
        name: this.name,
        category: this.category,
        passed: true,
        severity: "low",
        score: 0,
        confidence: 80,
      };
    }

    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score: Math.min(riskScore, 100),
      confidence: 80,
      flag: {
        type: "liquidity_concerns",
        severity: severity.toUpperCase() as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | "CRITICAL",
        title: "Liquidity Pool Concerns",
        description: `Concerning liquidity patterns detected. ${issues.length} issue(s) found.`,
        evidence: issues.join(" | "),
        confidence: 80,
      },
    };
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
