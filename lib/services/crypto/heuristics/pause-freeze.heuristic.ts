/**
 * Pause/Freeze Function Heuristic
 *
 * Detects pause or freeze mechanisms that can halt contract functionality.
 * These functions allow owners to stop all transfers, potentially trapping funds.
 *
 * Risk Factors:
 * - Pausable functionality (can halt all transfers)
 * - Freeze individual accounts
 * - Emergency stop mechanisms
 * - Owner-controlled pause
 *
 * Weight: 22 (High Priority)
 * Category: Tier 2 - Advanced Static Analysis
 */

import { BaseHeuristic } from "./base.heuristic";
import type { HeuristicResult, ContractAnalysisData } from "../types";

export class PauseFreezeHeuristic extends BaseHeuristic {
  name = "Pause/Freeze Function Detection";
  category = "code" as const;
  weight = 22;

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

    // Check for pausable functionality
    const pausable = this.detectPausable(sourceCode, abi);
    if (pausable.detected) {
      issues.push(`Pausable contract: ${pausable.evidence}`);
      riskScore += 35;
      severity = "high";
    }

    // Check for freeze functionality
    const freezable = this.detectFreezable(sourceCode, abi);
    if (freezable.detected) {
      issues.push(`Account freeze capability: ${freezable.evidence}`);
      riskScore += 30;
      if (severity === "low") severity = "high";
    }

    // Check for emergency stop
    const emergencyStop = this.detectEmergencyStop(sourceCode, abi);
    if (emergencyStop.detected) {
      issues.push(`Emergency stop mechanism: ${emergencyStop.evidence}`);
      riskScore += 25;
      if (severity === "low") severity = "medium";
    }

    // Check for transfer blocking
    const transferBlock = this.detectTransferBlock(sourceCode);
    if (transferBlock.detected) {
      issues.push(`Transfer blocking: ${transferBlock.evidence}`);
      riskScore += 20;
      if (severity === "low") severity = "medium";
    }

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

    // Upgrade to critical if multiple pause mechanisms
    if (issues.length >= 3 || riskScore >= 70) {
      severity = "critical";
    }

    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score: Math.min(riskScore, 100),
      confidence: 85,
      flag: {
        type: "pause_freeze",
        severity: severity.toUpperCase() as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | "CRITICAL",
        title: "Pause/Freeze Mechanisms Detected",
        description: `This contract can pause or freeze token transfers, potentially trapping holder funds. ${issues.length} mechanism(s) detected.`,
        evidence: issues.join(" | "),
        confidence: 85,
      },
    };
  }

  /**
   * Detect Pausable pattern (OpenZeppelin or custom)
   */
  private detectPausable(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    // Check for OpenZeppelin Pausable inheritance
    if (sourceCode.includes("Pausable") || sourceCode.includes("is Pausable")) {
      const pauseFunctions = abi.filter(
        (item: any) =>
          item.type === "function" &&
          item.name &&
          /pause|unpause/i.test(item.name)
      );

      if (pauseFunctions.length > 0) {
        return {
          detected: true,
          evidence: `OpenZeppelin Pausable (functions: ${pauseFunctions.map((f: any) => f.name).join(", ")})`,
        };
      }
    }

    // Check for custom pause implementation
    const customPausePatterns = [
      /bool\s+(public\s+|private\s+)?paused/i,
      /bool\s+(public\s+|private\s+)?_paused/i,
      /whenNotPaused/i,
      /whenPaused/i,
    ];

    for (const pattern of customPausePatterns) {
      if (pattern.test(sourceCode)) {
        // Check if pause affects transfers
        if (
          sourceCode.includes("require(!paused") ||
          sourceCode.includes("require(!_paused") ||
          sourceCode.includes("whenNotPaused")
        ) {
          return {
            detected: true,
            evidence: "Custom pause mechanism affecting transfers",
          };
        }
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect freeze functionality for individual accounts
   */
  private detectFreezable(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const freezePatterns = [
      /frozen/i,
      /isFrozen/i,
      /freeze/i,
      /frozenAccount/i,
    ];

    for (const pattern of freezePatterns) {
      if (pattern.test(sourceCode)) {
        // Look for freeze functions in ABI
        const freezeFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /freeze|unfreeze/i.test(item.name)
        );

        if (freezeFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${freezeFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }

        // Check if freeze affects transfers
        if (
          sourceCode.includes("require(!frozen") ||
          sourceCode.includes("require(!isFrozen")
        ) {
          return {
            detected: true,
            evidence: "Accounts can be frozen, preventing transfers",
          };
        }
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect emergency stop mechanisms
   */
  private detectEmergencyStop(
    sourceCode: string,
    abi: any[]
  ): { detected: boolean; evidence: string } {
    const emergencyPatterns = [
      /emergencyStop/i,
      /emergency/i,
      /circuit\s*breaker/i,
      /killSwitch/i,
    ];

    for (const pattern of emergencyPatterns) {
      if (pattern.test(sourceCode)) {
        const emergencyFunctions = abi.filter(
          (item: any) =>
            item.type === "function" &&
            item.name &&
            /emergency|kill|stop/i.test(item.name)
        );

        if (emergencyFunctions.length > 0) {
          return {
            detected: true,
            evidence: `Functions: ${emergencyFunctions.map((f: any) => f.name).join(", ")}`,
          };
        }
      }
    }

    return { detected: false, evidence: "" };
  }

  /**
   * Detect transfer blocking mechanisms
   */
  private detectTransferBlock(sourceCode: string): {
    detected: boolean;
    evidence: string;
  } {
    const blockPatterns = [
      /transfersBlocked/i,
      /blockTransfers/i,
      /disableTransfers/i,
      /lockTransfers/i,
    ];

    for (const pattern of blockPatterns) {
      if (pattern.test(sourceCode)) {
        return {
          detected: true,
          evidence: "Transfer blocking mechanism detected",
        };
      }
    }

    // Check for transfer enable/disable toggle
    if (
      sourceCode.includes("transfersEnabled") &&
      (sourceCode.includes("= false") || sourceCode.includes("onlyOwner"))
    ) {
      return {
        detected: true,
        evidence: "Transfers can be disabled by owner",
      };
    }

    return { detected: false, evidence: "" };
  }
}
