// lib/services/crypto/heuristics/base.heuristic.ts
import { ContractAnalysisData, HeuristicResult } from "../types";

export abstract class BaseHeuristic {
  abstract name: string;
  abstract category: "code" | "liquidity" | "tokenomics" | "transparency";
  abstract weight: number;

  abstract analyze(data: ContractAnalysisData): Promise<HeuristicResult>;

  /**
   * Helper to create a safe result (no issues found)
   */
  protected createSafeResult(confidence: number = 100): HeuristicResult {
    return {
      name: this.name,
      category: this.category,
      passed: true,
      severity: "low",
      score: 0,
      confidence,
    };
  }

  /**
   * Helper to create an unsafe result with a flag
   */
  protected createUnsafeResult(
    severity: "low" | "medium" | "high" | "critical",
    score: number,
    confidence: number,
    flagType: string,
    title: string,
    description: string,
    evidence: string
  ): HeuristicResult {
    return {
      name: this.name,
      category: this.category,
      passed: false,
      severity,
      score,
      confidence,
      flag: {
        type: flagType,
        severity: severity.toUpperCase() as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | "CRITICAL",
        title,
        description,
        evidence,
        confidence,
      },
    };
  }
}
