// lib/services/crypto/heuristics/ownership-renouncement.heuristic.ts
import { BaseHeuristic } from "./base.heuristic";
import { ContractAnalysisData, HeuristicResult } from "../types";

export class OwnershipRenouncementHeuristic extends BaseHeuristic {
  name = "Ownership Renouncement";
  category = "transparency" as const;
  weight = 15;

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { abi, sourceCode } = data.sourceCode || {};

    if (!abi || !sourceCode) {
      return this.createSafeResult(0);
    }

    // Check for ownership-related functions
    const ownershipFunctions = abi.filter(
      (item: any) =>
        item.type === "function" &&
        (item.name?.toLowerCase() === "owner" ||
          item.name?.toLowerCase() === "renounceownership" ||
          item.name?.toLowerCase() === "transferownership")
    );

    if (ownershipFunctions.length === 0) {
      // No ownership pattern detected, might be safe
      return this.createSafeResult(50);
    }

    // Check if ownership has been renounced
    const hasRenounceOwnership = ownershipFunctions.some(
      (fn: any) => fn.name?.toLowerCase() === "renounceownership"
    );

    // Look for evidence of renouncement in source
    const hasRenouncedEvidence =
      sourceCode.includes("renounceOwnership()") ||
      sourceCode.includes("owner = address(0)") ||
      sourceCode.includes("_owner = address(0)");

    if (hasRenounceOwnership && !hasRenouncedEvidence) {
      return this.createUnsafeResult(
        "medium",
        50,
        70,
        "ownership_not_renounced",
        "Contract Ownership Not Renounced",
        "Contract has an owner with privileged functions. Ownership has not been renounced, allowing potential future changes.",
        "Owner still has control over contract"
      );
    }

    if (hasRenouncedEvidence) {
      return this.createSafeResult(100);
    }

    return this.createSafeResult(70);
  }
}
