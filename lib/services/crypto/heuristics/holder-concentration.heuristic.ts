// lib/services/crypto/heuristics/holder-concentration.heuristic.ts
import { BaseHeuristic } from "./base.heuristic";
import { ContractAnalysisData, HeuristicResult } from "../types";

export class HolderConcentrationHeuristic extends BaseHeuristic {
  name = "Token Holder Concentration";
  category = "tokenomics" as const;
  weight = 20;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { topHolderConcentration } = data.holderData || {};

    if (
      topHolderConcentration === undefined ||
      topHolderConcentration === null
    ) {
      return this.createSafeResult(0);
    }

    // Thresholds: >75% critical, >50% high, >30% medium
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let score = 0;

    if (topHolderConcentration > 75) {
      severity = "critical";
      score = 85;
    } else if (topHolderConcentration > 50) {
      severity = "high";
      score = 70;
    } else if (topHolderConcentration > 30) {
      severity = "medium";
      score = 45;
    }

    if (score > 0) {
      return this.createUnsafeResult(
        severity,
        score,
        90,
        "holder_concentration",
        "High Token Concentration in Few Wallets",
        `Top 10 wallets hold ${topHolderConcentration}% of total supply. High concentration increases dump risk and centralization.`,
        `Concentration: ${topHolderConcentration}%`
      );
    }

    return this.createSafeResult(90);
  }
}
