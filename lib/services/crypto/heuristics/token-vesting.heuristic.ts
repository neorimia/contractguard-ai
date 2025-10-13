/**
 * Token Vesting Heuristic
 *
 * Validates token vesting schedules and lock mechanisms.
 * Proper vesting prevents immediate dumps by team/investors.
 *
 * Risk Factors:
 * - No vesting schedule for team tokens
 * - Short vesting periods (< 6 months)
 * - Vesting can be bypassed by owner
 * - No cliff period
 *
 * Weight: 18 (Medium-High Priority)
 * Category: Tier 2 - Advanced Static Analysis
 */

import { BaseHeuristic } from "./base.heuristic";
import type { HeuristicResult, ContractAnalysisData } from "../types";

export class TokenVestingHeuristic extends BaseHeuristic {
  name = "Token Vesting Validation";
  category = "tokenomics" as const;
  weight = 18;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { sourceCode, abi } = data.sourceCode || {};

    if (!sourceCode || !abi) {
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

    // Check for vesting implementation
    const hasVesting = this.detectVesting(sourceCode, abi);

    if (!hasVesting.detected) {
      // No vesting is a risk for projects with team allocations
      const hasTeamAllocation = this.detectTeamAllocation(sourceCode);

      if (hasTeamAllocation) {
        issues.push("No vesting schedule detected for team tokens");
        riskScore += 40;
        severity = "high";
      }
    } else {
      // Vesting exists, check quality
      const vestingQuality = this.assessVestingQuality(
        sourceCode,
        hasVesting.evidence
      );

      if (vestingQuality.hasIssues) {
        issues.push(...vestingQuality.issues);
        riskScore += vestingQuality.riskScore;
        severity = vestingQuality.severity;
      }
    }

    // Check for lock mechanisms
    const lockMechanism = this.detectLockMechanism(sourceCode, abi);
    if (!lockMechanism.detected && !hasVesting.detected) {
      issues.push("No token lock mechanism found");
      riskScore += 25;
      if (severity === "low") severity = "medium";
    }

    // Check for vesting bypass
    const canBypass = this.detectVestingBypass(sourceCode);
    if (canBypass.detected) {
      issues.push(`Vesting can be bypassed: ${canBypass.evidence}`);
      riskScore += 35;
      severity = "high";
    }

    if (issues.length === 0) {
      return {
        name: this.name,
        category: this.category,
        passed: true,
        severity: "low",
        score: 0,
        confidence: 75,
      };
    }

    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score: Math.min(riskScore, 100),
      confidence: 75,
      flag: {
        type: "vesting_issues",
        severity,
        title: "Token Vesting Concerns",
        description: `Inadequate or missing token vesting mechanisms detected. ${issues.length} issue(s) found.`,
        evidence: issues.join(" | "),
        confidence: 75,
      },
    };
  }

  /**
   * Detect vesting implementation
   */
  private detectVesting(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const vestingPatterns = [
      /vesting/i,
      /VestingSchedule/i,
      /TokenVesting/i,
      /vestingPeriod/i,
      /releaseSchedule/i,
    ];

    for (const pattern of vestingPatterns) {
      if (pattern.test(sourceCode)) {
        const vestingFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /vesting|release|unlock/i.test(item.name)
        );

        if (vestingFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${vestingFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }

        return {
          detected: true,
          evidence: "Vesting mechanism found in source",
        };
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect team allocation
   */
  private detectTeamAllocation(sourceCode: string): boolean {
    const teamPatterns = [
      /teamWallet/i,
      /teamAddress/i,
      /team.*allocation/i,
      /founderWallet/i,
      /advisorWallet/i,
    ];

    return teamPatterns.some((pattern) => pattern.test(sourceCode));
  }

  /**
   * Assess vesting quality
   */
  private assessVestingQuality(
    sourceCode: string,
    evidence: string
  ): {
    hasIssues: boolean;
    issues: string[];
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  } {
    const issues: string[] = [];
    let riskScore = 0;
    let severity: "low" | "medium" | "high" | "critical" = "low";

    // Check vesting duration
    const durationMatch = sourceCode.match(
      /vesting.*?(\d+)\s*(days|months|years)/i
    );
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();

      let durationInMonths = 0;
      if (unit === "days") durationInMonths = value / 30;
      else if (unit === "months") durationInMonths = value;
      else if (unit === "years") durationInMonths = value * 12;

      if (durationInMonths < 6) {
        issues.push(`Short vesting period: ${value} ${unit}`);
        riskScore += 30;
        severity = "medium";
      }
    }

    // Check for cliff period
    const hasCliff = /cliff/i.test(sourceCode);
    if (!hasCliff) {
      issues.push("No cliff period detected");
      riskScore += 20;
      if (severity === "low") severity = "medium";
    }

    // Check for linear release
    const isLinear =
      sourceCode.includes("linear") ||
      sourceCode.includes("proportional") ||
      sourceCode.includes("gradual");

    if (!isLinear) {
      // Check if it's immediate release
      if (
        sourceCode.includes("release(") &&
        !sourceCode.includes("block.timestamp")
      ) {
        issues.push("Tokens may be released immediately");
        riskScore += 25;
        severity = "medium";
      }
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      riskScore,
      severity,
    };
  }

  /**
   * Detect lock mechanisms
   */
  private detectLockMechanism(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const lockPatterns = [
      /lock\(/i,
      /locked/i,
      /lockUntil/i,
      /releaseTime/i,
      /unlockTime/i,
    ];

    for (const pattern of lockPatterns) {
      if (pattern.test(sourceCode)) {
        const lockFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /lock|unlock/i.test(item.name)
        );

        if (lockFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${lockFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }

        return {
          detected: true,
          evidence: "Lock mechanism found",
        };
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect vesting bypass mechanisms
   */
  private detectVestingBypass(sourceCode: string): {
    detected: boolean;
    evidence: string;
  } {
    // Check for owner override of vesting
    const ownerBypassPatterns = [
      /function.*release.*onlyOwner/is,
      /function.*unlock.*onlyOwner/is,
      /owner.*can.*release/i,
      /emergencyRelease.*onlyOwner/is,
    ];

    for (const pattern of ownerBypassPatterns) {
      if (pattern.test(sourceCode)) {
        return {
          detected: true,
          evidence: "Owner can bypass vesting schedule",
        };
      }
    }

    // Check for vesting modification
    if (
      sourceCode.includes("setVestingSchedule") ||
      sourceCode.includes("updateVesting") ||
      sourceCode.includes("modifyVesting")
    ) {
      if (sourceCode.includes("onlyOwner")) {
        return {
          detected: true,
          evidence: "Owner can modify vesting schedule",
        };
      }
    }

    return { detected: false, evidence: "" };
  }
}
