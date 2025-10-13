// lib/services/crypto/risk-scoring.service.ts
import { ContractAnalysisData, HeuristicResult, RiskAssessment } from "./types";
import {
  BaseHeuristic,
  ContractVerificationHeuristic,
  PrivilegedMintHeuristic,
  HolderConcentrationHeuristic,
  LiquidityLockHeuristic,
  OwnershipRenouncementHeuristic,
} from "./heuristics";
import { RiskFlag } from "@/db/schema";

export class RiskScoringService {
  private heuristics: BaseHeuristic[] = [
    new ContractVerificationHeuristic(),
    new PrivilegedMintHeuristic(),
    new HolderConcentrationHeuristic(),
    new LiquidityLockHeuristic(),
    new OwnershipRenouncementHeuristic(),
  ];

  async calculateRiskScore(
    data: ContractAnalysisData
  ): Promise<RiskAssessment> {
    const results = await Promise.all(
      this.heuristics.map((h) => h.analyze(data))
    );

    // Weighted average of heuristic scores
    const totalWeight = this.heuristics.reduce((sum, h) => sum + h.weight, 0);
    const weightedScore =
      results.reduce((sum, result, idx) => {
        const heuristic = this.heuristics[idx];
        return sum + result.score * heuristic.weight;
      }, 0) / totalWeight;

    // Determine risk category
    let riskCategory: string;
    if (weightedScore >= 80) riskCategory = "critical";
    else if (weightedScore >= 60) riskCategory = "high";
    else if (weightedScore >= 40) riskCategory = "medium";
    else if (weightedScore >= 20) riskCategory = "low";
    else riskCategory = "very_low";

    // Collect all red flags
    const flags: RiskFlag[] = results
      .filter((r) => r.flag)
      .map((r) => r.flag!)
      .sort((a, b) => {
        const severityOrder: Record<string, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    // Calculate overall confidence (average of all heuristic confidences)
    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      riskScore: Math.round(weightedScore),
      riskCategory,
      confidence: Math.round(avgConfidence),
      flags,
      heuristicResults: results,
      recommendation: this.generateRecommendation(riskCategory, flags),
    };
  }

  private generateRecommendation(category: string, flags: RiskFlag[]): string {
    switch (category) {
      case "critical":
        return "🚨 AVOID - This contract exhibits multiple critical red flags indicating high scam probability. DO NOT invest.";
      case "high":
        return "⚠️ HIGH RISK - Significant concerns detected. Extreme caution advised. Consider waiting for audit or community validation.";
      case "medium":
        return "⚡ PROCEED WITH CAUTION - Some risk factors present. Research thoroughly before investing. Only invest what you can afford to lose.";
      case "low":
        return "✅ LOW RISK - Few concerns detected, but inherent crypto risks remain. Always do your own research.";
      default:
        return "✅ VERY LOW RISK - Minimal red flags. Contract appears relatively safe, but no guarantee. DYOR.";
    }
  }

  /**
   * Get all registered heuristics
   */
  getHeuristics(): BaseHeuristic[] {
    return this.heuristics;
  }

  /**
   * Add a custom heuristic
   */
  addHeuristic(heuristic: BaseHeuristic): void {
    this.heuristics.push(heuristic);
  }

  /**
   * Remove a heuristic by name
   */
  removeHeuristic(name: string): void {
    this.heuristics = this.heuristics.filter((h) => h.name !== name);
  }
}
