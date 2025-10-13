/**
 * Contract Activity Heuristic
 *
 * Monitors contract activity level and patterns.
 * Low activity or suspicious patterns can indicate abandonment or scam.
 *
 * Risk Factors:
 * - Very low transaction count (< 100)
 * - No recent activity (> 30 days)
 * - Suspicious activity patterns
 * - Recently deployed (< 7 days) with high claims
 *
 * Weight: 15 (Medium Priority)
 * Category: Tier 2 - Advanced Static Analysis
 */

import { BaseHeuristic } from "./base.heuristic";
import type { HeuristicResult, ContractAnalysisData } from "../types";

export class ContractActivityHeuristic extends BaseHeuristic {
  name = "Contract Activity Monitoring";
  category = "transparency" as const;
  weight = 15;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { metadata } = data;

    if (!metadata) {
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

    // Check transaction count
    const txCount = metadata.txCount || 0;
    if (txCount < 100) {
      issues.push(`Very low activity: only ${txCount} transactions`);
      riskScore += 30;
      severity = "medium";
    } else if (txCount < 500) {
      issues.push(`Low activity: ${txCount} transactions`);
      riskScore += 15;
      if (severity === "low") severity = "low";
    }

    // Check deployment age
    const deployDate = metadata.deployDate
      ? new Date(metadata.deployDate)
      : null;
    if (deployDate) {
      const daysSinceDeployment = this.getDaysSince(deployDate);

      if (daysSinceDeployment < 7) {
        issues.push(`Recently deployed: ${daysSinceDeployment} days ago`);
        riskScore += 25;
        severity = "medium";
      }

      // Check for abandonment (no recent activity)
      const lastActivity = this.getLastActivityDate(metadata);
      if (lastActivity) {
        const daysSinceActivity = this.getDaysSince(lastActivity);

        if (daysSinceActivity > 90 && daysSinceDeployment > 90) {
          issues.push(
            `Potentially abandoned: no activity for ${daysSinceActivity} days`
          );
          riskScore += 35;
          severity = "high";
        } else if (daysSinceActivity > 30) {
          issues.push(
            `Low recent activity: ${daysSinceActivity} days since last transaction`
          );
          riskScore += 20;
          if (severity === "low") severity = "medium";
        }
      }
    }

    // Check for suspicious patterns
    const suspiciousPattern = this.detectSuspiciousPatterns(metadata, txCount);
    if (suspiciousPattern.detected) {
      issues.push(`Suspicious pattern: ${suspiciousPattern.evidence}`);
      riskScore += suspiciousPattern.riskScore;
      // Update severity if suspicious pattern severity is higher
      const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
      if (
        severityLevels[suspiciousPattern.severity] > severityLevels[severity]
      ) {
        severity = suspiciousPattern.severity;
      }
    }

    if (issues.length === 0) {
      return {
        name: this.name,
        category: this.category,
        passed: true,
        severity: "low",
        score: 0,
        confidence: 70,
      };
    }

    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score: Math.min(riskScore, 100),
      confidence: 70,
      flag: {
        type: "activity_concerns",
        severity,
        title: "Contract Activity Concerns",
        description: `Unusual contract activity patterns detected. ${issues.length} concern(s) identified.`,
        evidence: issues.join(" | "),
        confidence: 70,
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

  /**
   * Get last activity date from metadata
   */
  private getLastActivityDate(metadata: any): Date | null {
    // This would typically come from blockchain data
    // For now, we'll use deploy date as fallback
    if (metadata.lastActivityDate) {
      return new Date(metadata.lastActivityDate);
    }
    return null;
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousPatterns(
    metadata: any,
    txCount: number
  ): {
    detected: boolean;
    evidence: string;
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  } {
    const deployDate = metadata.deployDate
      ? new Date(metadata.deployDate)
      : null;

    if (!deployDate) {
      return { detected: false, evidence: "", riskScore: 0, severity: "low" };
    }

    const daysSinceDeployment = this.getDaysSince(deployDate);

    // Pattern 1: New contract with very high claims
    if (daysSinceDeployment < 7 && txCount > 10000) {
      return {
        detected: true,
        evidence: "Abnormally high activity for new contract",
        riskScore: 30,
        severity: "high",
      };
    }

    // Pattern 2: Sudden activity spike then silence
    if (metadata.activityPattern) {
      const { initialSpike, recentSilence } = metadata.activityPattern;
      if (initialSpike && recentSilence) {
        return {
          detected: true,
          evidence: "Initial activity spike followed by silence",
          riskScore: 35,
          severity: "high",
        };
      }
    }

    // Pattern 3: Very old contract with minimal activity
    if (daysSinceDeployment > 365 && txCount < 100) {
      return {
        detected: true,
        evidence: "Old contract with very low total activity",
        riskScore: 25,
        severity: "medium",
      };
    }

    return { detected: false, evidence: "", riskScore: 0, severity: "low" };
  }
}
