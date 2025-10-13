"use client";

import { HeuristicResult } from "@/lib/services/crypto/types";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface HeuristicsBreakdownProps {
  results: HeuristicResult[];
}

export function HeuristicsBreakdown({ results }: HeuristicsBreakdownProps) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      code: "💻",
      liquidity: "💧",
      tokenomics: "📊",
      transparency: "🔍",
    };
    return icons[category] || "📋";
  };

  const getStatusIcon = (passed: boolean, severity: string) => {
    if (passed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (severity === "critical" || severity === "high") {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div
          key={`${result.name}-${index}`}
          className="p-4 bg-neutral-800/50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(result.passed, result.severity)}
              <div>
                <h4 className="font-semibold">
                  {getCategoryIcon(result.category)} {result.name}
                </h4>
                <p className="text-sm text-neutral-400 capitalize">
                  {result.category} • {result.severity} severity
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${getScoreColor(result.score)}`}
              >
                {result.score}
              </div>
              <div className="text-xs text-neutral-400">
                {result.confidence}% conf.
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(result.score).replace("text-", "bg-")}`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
