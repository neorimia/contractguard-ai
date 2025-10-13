// lib/services/crypto/heuristics/privileged-mint.heuristic.ts
import { BaseHeuristic } from "./base.heuristic";
import { ContractAnalysisData, HeuristicResult } from "../types";

export class PrivilegedMintHeuristic extends BaseHeuristic {
  name = "Privileged Mint Functions";
  category = "code" as const;
  weight = 25; // Critical

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { abi, sourceCode } = data.sourceCode || {};

    if (!abi || !sourceCode) {
      return this.createSafeResult(0);
    }

    // Check ABI for mint functions
    const mintFunctions = abi.filter(
      (item: any) =>
        item.type === "function" && item.name?.toLowerCase().includes("mint")
    );

    if (mintFunctions.length === 0) {
      return this.createSafeResult(100);
    }

    // Check if mint functions have access control
    const hasMintControl = mintFunctions.some((fn: any) => {
      const fnSignature = `function ${fn.name}`;
      const sourceIndex = sourceCode.indexOf(fnSignature);

      if (sourceIndex === -1) return false;

      const sourceSnippet = sourceCode.substring(
        sourceIndex,
        Math.min(sourceIndex + 500, sourceCode.length)
      );

      return (
        sourceSnippet.includes("onlyOwner") ||
        sourceSnippet.includes("onlyRole") ||
        sourceSnippet.includes("require(msg.sender ==") ||
        sourceSnippet.includes("require(msg.sender==")
      );
    });

    if (mintFunctions.length > 0 && hasMintControl) {
      return this.createUnsafeResult(
        "critical",
        90,
        85,
        "privileged_mint",
        "Owner Can Mint Unlimited Tokens",
        `Contract contains ${mintFunctions.length} mint function(s) controlled by owner/admin. This allows arbitrary token inflation, diluting holder value.`,
        `Functions: ${mintFunctions.map((f: any) => f.name).join(", ")}`
      );
    }

    return this.createSafeResult(90);
  }
}
