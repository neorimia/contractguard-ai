// lib/services/crypto/heuristics/contract-verification.heuristic.ts
import { BaseHeuristic } from "./base.heuristic";
import { ContractAnalysisData, HeuristicResult } from "../types";

export class ContractVerificationHeuristic extends BaseHeuristic {
  name = "Contract Verification Status";
  category = "code" as const;
  weight = 20; // High weight

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const isVerified = data.sourceCode?.isVerified ?? false;

    if (!isVerified) {
      return this.createUnsafeResult(
        "high",
        80,
        95,
        "unverified_contract",
        "Contract Source Code Not Verified",
        "This contract has not been verified on the blockchain explorer. Without source code, it's impossible to audit for malicious functions.",
        `Contract ${data.address} on ${data.chain}`
      );
    }

    return this.createSafeResult(100);
  }
}
