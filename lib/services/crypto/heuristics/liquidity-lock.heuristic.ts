// lib/services/crypto/heuristics/liquidity-lock.heuristic.ts
import { BaseHeuristic } from "./base.heuristic";
import { ContractAnalysisData, HeuristicResult } from "../types";

export class LiquidityLockHeuristic extends BaseHeuristic {
  name = "Liquidity Lock Detection";
  category = "liquidity" as const;
  weight = 25; // High weight

  async analyze(data: ContractAnalysisData): Promise<HeuristicResult> {
    const { abi, sourceCode } = data.sourceCode || {};
    const { totalLiquidityUsd } = data.liquidityData || {};

    if (!abi || !sourceCode) {
      return this.createSafeResult(0);
    }

    // Check for liquidity removal functions
    const removeLiquidityFunctions = abi.filter(
      (item: any) =>
        item.type === "function" &&
        (item.name?.toLowerCase().includes("removeliquidity") ||
          item.name?.toLowerCase().includes("withdraw"))
    );

    if (removeLiquidityFunctions.length === 0) {
      return this.createSafeResult(100);
    }

    // Check if removal functions have access control
    const hasRemovalControl = removeLiquidityFunctions.every((fn: any) => {
      const fnSignature = `function ${fn.name}`;
      const sourceIndex = sourceCode.indexOf(fnSignature);

      if (sourceIndex === -1) return true; // Assume safe if not found

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

    // Check if there's significant liquidity at risk
    const liquidityUsd = parseFloat(totalLiquidityUsd || "0");
    const hasSignificantLiquidity = liquidityUsd > 10000; // $10k threshold

    if (
      removeLiquidityFunctions.length > 0 &&
      hasRemovalControl &&
      hasSignificantLiquidity
    ) {
      return this.createUnsafeResult(
        "high",
        75,
        80,
        "unlocked_liquidity",
        "Owner Can Remove Liquidity",
        `Contract allows owner to remove liquidity (${this.formatLiquidity(liquidityUsd)}). This could enable a rug pull.`,
        `Functions: ${removeLiquidityFunctions.map((f: any) => f.name).join(", ")}`
      );
    }

    return this.createSafeResult(80);
  }

  private formatLiquidity(usd: number): string {
    if (usd >= 1000000) {
      return `$${(usd / 1000000).toFixed(2)}M`;
    } else if (usd >= 1000) {
      return `$${(usd / 1000).toFixed(2)}K`;
    }
    return `$${usd.toFixed(2)}`;
  }
}
