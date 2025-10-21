"use client";

/**
 * Liquidity Pools Display Component
 *
 * Shows all liquidity pools and their distribution across DEXs
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Droplet, TrendingUp, Lock, AlertTriangle } from "lucide-react";

interface LiquidityPair {
  dex: string;
  pair: string;
  liquidityUsd: number | string;
}

interface LiquidityPoolsDisplayProps {
  totalLiquidityUsd: string | number;
  liquidityPairs: LiquidityPair[];
  isLocked?: boolean;
  poolCount?: number;
  className?: string;
}

export function LiquidityPoolsDisplay({
  totalLiquidityUsd,
  liquidityPairs = [],
  isLocked = false,
  poolCount = 0,
  className,
}: LiquidityPoolsDisplayProps) {
  const totalLiquidity =
    typeof totalLiquidityUsd === "string"
      ? parseFloat(totalLiquidityUsd)
      : totalLiquidityUsd;

  // Sort pairs by liquidity (highest first)
  const sortedPairs = [...liquidityPairs]
    .map((pair) => ({
      ...pair,
      liquidityUsd:
        typeof pair.liquidityUsd === "string"
          ? parseFloat(pair.liquidityUsd)
          : pair.liquidityUsd,
    }))
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd);

  // Group by DEX
  const dexGroups = sortedPairs.reduce(
    (acc, pair) => {
      const dex = pair.dex.toLowerCase();
      if (!acc[dex]) acc[dex] = [];
      acc[dex].push(pair);
      return acc;
    },
    {} as Record<string, typeof sortedPairs>
  );

  // Calculate DEX distribution
  const dexStats = Object.entries(dexGroups).map(([dex, pairs]) => {
    const dexTotal = pairs.reduce((sum, p) => sum + p.liquidityUsd, 0);
    return {
      dex,
      total: dexTotal,
      percentage: totalLiquidity > 0 ? (dexTotal / totalLiquidity) * 100 : 0,
      pairs: pairs.length,
    };
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    if (address.startsWith("0x") && address.length >= 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address.slice(0, 20) + (address.length > 20 ? "..." : "");
  };

  return (
    <Card
      className={`p-6 bg-neutral-900 border-neutral-800 ${className || ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-400" />
            Liquidity Analysis
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            {poolCount} pool{poolCount !== 1 ? "s" : ""} across{" "}
            {Object.keys(dexGroups).length} DEX
            {Object.keys(dexGroups).length !== 1 ? "es" : ""}
          </p>
        </div>
        {isLocked && (
          <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Locked</span>
          </div>
        )}
      </div>

      {/* Total Liquidity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-800/50 p-4 rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Total Liquidity</div>
          <div className="text-2xl font-bold text-blue-400">
            {formatCurrency(totalLiquidity)}
          </div>
        </div>
        <div className="bg-neutral-800/50 p-4 rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Largest Pool</div>
          <div className="text-2xl font-bold text-white">
            {sortedPairs.length > 0
              ? formatCurrency(sortedPairs[0].liquidityUsd)
              : "$0"}
          </div>
        </div>
        <div className="bg-neutral-800/50 p-4 rounded-lg">
          <div className="text-sm text-neutral-400 mb-1">Average Pool</div>
          <div className="text-2xl font-bold text-white">
            {sortedPairs.length > 0
              ? formatCurrency(totalLiquidity / sortedPairs.length)
              : "$0"}
          </div>
        </div>
      </div>

      {/* DEX Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neutral-400 mb-3">
          DEX Distribution
        </h4>
        <div className="space-y-2">
          {dexStats.map((stat) => (
            <div key={stat.dex} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white capitalize">
                    {stat.dex}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {formatCurrency(stat.total)} ({stat.percentage.toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-neutral-500">
                {stat.pairs} pool{stat.pairs !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity Pools List */}
      <div>
        <h4 className="text-sm font-medium text-neutral-400 mb-3">
          All Liquidity Pools
        </h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sortedPairs.map((pair, idx) => {
            const percentage =
              totalLiquidity > 0
                ? (pair.liquidityUsd / totalLiquidity) * 100
                : 0;
            return (
              <div
                key={`pool-${idx}-${pair.pair}`}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Droplet className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {pair.dex}
                      </span>
                      <span className="text-xs text-neutral-500">
                        #{idx + 1}
                      </span>
                    </div>
                    <code className="text-xs text-neutral-400 font-mono block truncate">
                      {formatAddress(pair.pair)}
                    </code>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-sm font-medium text-white">
                    {formatCurrency(pair.liquidityUsd)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning for low liquidity */}
      {totalLiquidity < 10000 && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400 font-medium">
              Low Liquidity Warning
            </p>
            <p className="text-xs text-amber-400/80 mt-1">
              Total liquidity below $10K may result in high slippage and
              difficulty selling tokens.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
