"use client";

import { motion } from "motion/react";
import { Shield, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

interface RiskScoreCardProps {
  riskScore: number;
  riskCategory: string;
  confidence: number;
  recommendation?: string;
}

export function RiskScoreCard({
  riskScore,
  riskCategory,
  confidence,
  recommendation,
}: RiskScoreCardProps) {
  const getRiskConfig = (category: string) => {
    switch (category) {
      case "critical":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          icon: <XCircle className="h-12 w-12" />,
          label: "CRITICAL RISK",
          emoji: "🚨",
        };
      case "high":
        return {
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          icon: <AlertTriangle className="h-12 w-12" />,
          label: "HIGH RISK",
          emoji: "⚠️",
        };
      case "medium":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          icon: <AlertTriangle className="h-12 w-12" />,
          label: "MEDIUM RISK",
          emoji: "⚡",
        };
      case "low":
        return {
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          icon: <CheckCircle className="h-12 w-12" />,
          label: "LOW RISK",
          emoji: "✅",
        };
      default:
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          icon: <Shield className="h-12 w-12" />,
          label: "VERY LOW RISK",
          emoji: "✅",
        };
    }
  };

  const config = getRiskConfig(riskCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-8 rounded-2xl border
        ${config.bgColor} ${config.borderColor}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={config.color}>{config.icon}</div>
          <div>
            <h3 className={`text-2xl font-bold ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Confidence: {confidence}%
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${config.color}`}>
            {riskScore}
          </div>
          <div className="text-sm text-neutral-400">/ 100</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${riskScore}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${config.color.replace("text-", "bg-")}`}
        />
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="p-4 bg-neutral-900 rounded-lg">
          <p className="text-sm text-neutral-300 leading-relaxed">
            {config.emoji} {recommendation}
          </p>
        </div>
      )}
    </motion.div>
  );
}
