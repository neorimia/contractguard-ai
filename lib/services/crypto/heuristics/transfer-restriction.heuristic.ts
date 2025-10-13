/**
 * Transfer Restriction Heuristic
 *
 * Detects blacklist/whitelist mechanisms that restrict token transfers.
 * These mechanisms can be used to prevent certain addresses from selling tokens.
 *
 * Risk Factors:
 * - Blacklist functions (can block specific addresses)
 * - Whitelist-only transfers (only approved addresses can trade)
 * - Transfer restrictions controlled by owner
 *
 * Weight: 20 (High Priority)
 * Category: Tier 2 - Advanced Static Analysis
 */

import { BaseHeuristic } from "./base.heuristic";
import type { HeuristicResult, ContractAnalysisData } from "../types";

export class TransferRestrictionHeuristic extends BaseHeuristic {
  name = "Transfer Restriction Detection";
  category = "code" as const;
  weight = 20;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { sourceCode, abi } = data.sourceCode || {};

    // If no source code, cannot analyze
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

    // Check for blacklist patterns
    const hasBlacklist = this.detectBlacklist(sourceCode, abi);
    if (hasBlacklist.detected) {
      issues.push(`Blacklist mechanism detected: ${hasBlacklist.evidence}`);
      riskScore += 30;
      severity = "high";
    }

    // Check for whitelist patterns
    const hasWhitelist = this.detectWhitelist(sourceCode, abi);
    if (hasWhitelist.detected) {
      issues.push(`Whitelist mechanism detected: ${hasWhitelist.evidence}`);
      riskScore += 25;
      if (severity === "low") severity = "medium";
    }

    // Check for owner-controlled transfer restrictions
    const hasOwnerRestrictions = this.detectOwnerRestrictions(sourceCode);
    if (hasOwnerRestrictions.detected) {
      issues.push(
        `Owner can restrict transfers: ${hasOwnerRestrictions.evidence}`
      );
      riskScore += 20;
      if (severity === "low") severity = "medium";
    }

    // Check for time-lock or trading restrictions
    const hasTimeLock = this.detectTimeLock(sourceCode);
    if (hasTimeLock.detected) {
      issues.push(`Transfer time-lock detected: ${hasTimeLock.evidence}`);
      riskScore += 15;
    }

    // If no issues found
    if (issues.length === 0) {
      return {
        name: this.name,
        category: this.category,
        passed: true,
        severity: "low",
        score: 0,
        confidence: 85,
      };
    }

    // Determine final severity based on combined issues
    if (riskScore >= 60) severity = "critical";
    else if (riskScore >= 40) severity = "high";
    else if (riskScore >= 20) severity = "medium";

    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score: Math.min(riskScore, 100),
      confidence: 80,
      flag: {
        type: "transfer_restrictions",
        severity,
        title: "Transfer Restrictions Detected",
        description: `This contract implements transfer restrictions that could prevent holders from selling tokens. ${issues.length} restriction mechanism(s) found.`,
        evidence: issues.join(" | "),
        confidence: 80,
      },
    };
  }

  /**
   * Detect blacklist mechanisms
   */
  private detectBlacklist(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const blacklistPatterns = [
      /blacklist/i,
      /isBlacklisted/i,
      /blocked/i,
      /banned/i,
      /_blackList/i,
      /blacklisted\[/i,
    ];

    // Check source code for blacklist variables/functions
    for (const pattern of blacklistPatterns) {
      if (pattern.test(sourceCode)) {
        // Look for blacklist functions in ABI
        const blacklistFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /blacklist|block|ban/i.test(item.name)
        );

        if (blacklistFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${blacklistFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }

        return {
          detected: true,
          evidence: "Blacklist mechanism found in source code",
        };
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect whitelist mechanisms
   */
  private detectWhitelist(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const whitelistPatterns = [
      /whitelist/i,
      /isWhitelisted/i,
      /allowed/i,
      /_whiteList/i,
      /whitelisted\[/i,
      /onlyWhitelisted/i,
    ];

    for (const pattern of whitelistPatterns) {
      if (pattern.test(sourceCode)) {
        // Check if whitelis is required for transfers
        const requiresWhitelist =
          sourceCode.includes("require(whitelisted") ||
          sourceCode.includes("require(_whiteList") ||
          sourceCode.includes("onlyWhitelisted");

        if (requiresWhitelist) {
          return {
            detected: true,
            evidence: "Transfers require whitelist approval",
          };
        }

        const whitelistFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /whitelist|allow/i.test(item.name)
        );

        if (whitelistFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${whitelistFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect owner-controlled restrictions
   */
  private detectOwnerRestrictions(sourceCode: string): {
    detected: boolean;
    evidence: string;
  } {
    // Look for transfer modifiers with owner checks
    const ownerRestrictPatterns = [
      /function\s+_transfer.*onlyOwner/s,
      /function\s+transfer.*require\(.*owner/is,
      /canTransfer.*onlyOwner/i,
      /enableTrading.*onlyOwner/i,
      /setTransferRestriction.*onlyOwner/i,
    ];

    for (const pattern of ownerRestrictPatterns) {
      if (pattern.test(sourceCode)) {
        return {
          detected: true,
          evidence: "Owner can control transfer permissions",
        };
      }
    }

    // Check for trading enable/disable mechanisms
    if (
      sourceCode.includes("tradingEnabled") ||
      sourceCode.includes("swapEnabled") ||
      sourceCode.includes("transfersEnabled")
    ) {
      const hasOwnerControl =
        sourceCode.includes("onlyOwner") &&
        (sourceCode.includes("enableTrading") ||
          sourceCode.includes("enableTransfers") ||
          sourceCode.includes("setTradingEnabled"));

      if (hasOwnerControl) {
        return {
          detected: true,
          evidence: "Owner can enable/disable trading",
        };
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect time-lock restrictions
   */
  private detectTimeLock(sourceCode: string): {
    detected: boolean;
    evidence: string;
  } {
    const timeLockPatterns = [
      /transferDelay/i,
      /cooldown/i,
      /lastTransfer/i,
      /transferTimestamp/i,
      /require\(.*block\.timestamp.*>/,
    ];

    for (const pattern of timeLockPatterns) {
      if (pattern.test(sourceCode)) {
        return {
          detected: true,
          evidence: "Transfer cooldown or delay mechanism",
        };
      }
    }

    return { detected: false, evidence: "" };
  }
}
