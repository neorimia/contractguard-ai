"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Lock,
  AlertTriangle,
  Shield,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SummaryReportData } from "@/lib/types/report-types";
import {
  LockedSectionPreview,
  CompactLockedPreview,
  LockedCard,
} from "./LockedSectionPreview";

interface SummaryReportViewProps {
  data: SummaryReportData;
  onUpgrade: () => void;
  onInstantPurchase: () => void;
}

export function SummaryReportView({
  data,
  onUpgrade,
  onInstantPurchase,
}: SummaryReportViewProps) {
  const getRiskConfig = (category: string) => {
    switch (category) {
      case "critical":
        return {
          color: "text-white",
          bgColor: "bg-black/50",
          borderColor: "border-white/30",
          icon: AlertTriangle,
          label: "CRITICAL RISK",
          textColor: "text-white",
          progressColor: "bg-white",
        };
      case "high":
        return {
          color: "text-white",
          bgColor: "bg-black/30",
          borderColor: "border-white/20",
          icon: AlertTriangle,
          label: "HIGH RISK",
          textColor: "text-white",
          progressColor: "bg-white",
        };
      case "medium":
        return {
          color: "text-white",
          bgColor: "bg-black/20",
          borderColor: "border-white/15",
          icon: AlertTriangle,
          label: "MEDIUM RISK",
          textColor: "text-white",
          progressColor: "bg-white",
        };
      case "low":
        return {
          color: "text-white",
          bgColor: "bg-black/10",
          borderColor: "border-white/10",
          icon: Shield,
          label: "LOW RISK",
          textColor: "text-white",
          progressColor: "bg-white",
        };
      default:
        return {
          color: "text-white",
          bgColor: "bg-black/5",
          borderColor: "border-white/5",
          icon: Shield,
          label: "VERY LOW RISK",
          textColor: "text-white",
          progressColor: "bg-white",
        };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-white bg-black border-white/30";
      case "high":
        return "text-white bg-black/80 border-white/20";
      case "medium":
        return "text-white bg-black/60 border-white/15";
      case "low":
        return "text-white bg-black/40 border-white/10";
      default:
        return "text-white bg-black/20 border-white/10";
    }
  };

  const riskConfig = getRiskConfig(data.riskCategory);
  const RiskIcon = riskConfig.icon;

  // Calculate savings for instant credits vs subscription
  const instantPrice = data.upgradeOptions.instantReport.price / 100;
  const monthlyPrice = data.upgradeOptions.proSubscription.price / 100;
  const dailyInstantCost = instantPrice; // Assuming 1 report per day
  const dailyProCost = monthlyPrice / 30;

  return (
    <div className="space-y-8">
      {/* Risk Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div
          className={`
          p-8 rounded-xl border
          ${riskConfig.bgColor} ${riskConfig.borderColor}
          backdrop-blur-sm
        `}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={riskConfig.color}>
                <RiskIcon className="h-12 w-12" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${riskConfig.color}`}>
                  {riskConfig.label}
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  Confidence: {data.confidence}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${riskConfig.color}`}>
                {data.riskScore}
              </div>
              <div className="text-sm text-white/70">/ 100</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-black/50 border border-white/20 rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.riskScore}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full ${riskConfig.progressColor}`}
            />
          </div>

          {/* Recommendation */}
          <div className="p-4 bg-black/30 border border-white/10 rounded-lg">
            <p className="text-sm text-white leading-relaxed">
              Recommendation:{" "}
              <span className="font-semibold text-white">
                {data.recommendation}
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Basic Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-xl border border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm text-white/70">Holders</p>
              <p className="font-semibold text-white">
                {data.holderCountRange}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm text-white/70">Liquidity</p>
              <p className="font-semibold text-white">{data.liquidityRange}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-white/20 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm text-white/70">Age</p>
              <p className="font-semibold text-white">{data.deployedAge}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top Issues Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border border-white/20 rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm"
      >
        {/* Section Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-white" />
              <h3 className="text-xl font-semibold text-white">
                Top Security Issues
              </h3>
              <Badge
                variant="outline"
                className="bg-black/50 border-white/30 text-white"
              >
                {data.topIssues.length} of {data.totalIssuesCount} shown
              </Badge>
            </div>
          </div>
          <p className="text-sm text-white/70 mt-2">
            Get the complete list of {data.totalIssuesCount} security issues
            found
          </p>
        </div>

        {/* Section Content */}
        <div className="p-6 space-y-3">
          {data.topIssues.map((issue, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border border-white/15 bg-black/30"
            >
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity.toUpperCase()}
              </Badge>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-white">
                  {issue.title}
                </h4>
                <p className="text-sm text-white/70 mt-1">
                  {issue.description}
                </p>
              </div>
            </div>
          ))}

          {/* Additional Issues Preview using LockedSectionPreview */}
          <LockedSectionPreview lockedHeight="300px">
            <div className="space-y-3">
              {/* Additional Issues Content */}
              {Array.from(
                {
                  length: Math.min(
                    5,
                    data.totalIssuesCount - data.topIssues.length
                  ),
                },
                (_, index) => (
                  <div
                    key={`preview-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-black/20"
                  >
                    <Badge className="text-white bg-black/60 border-white/15">
                      {index % 3 === 0
                        ? "HIGH"
                        : index % 2 === 0
                          ? "MEDIUM"
                          : "LOW"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white/80">
                        Additional Security Issue #
                        {index + data.topIssues.length + 1}
                      </h4>
                      <p className="text-xs text-white/60 mt-1">
                        Detailed analysis and remediation guidance available
                        with full report access.
                      </p>
                    </div>
                  </div>
                )
              )}

              {data.totalIssuesCount - data.topIssues.length > 5 && (
                <div className="p-3 text-center text-white/70 border border-dashed border-white/20 rounded-lg">
                  <span className="text-sm">
                    +{data.totalIssuesCount - data.topIssues.length - 5} more
                    detailed issues in full report
                  </span>
                </div>
              )}

              {/* Full Report CTA */}
              <div className="p-4 bg-black/30 border border-white/10 rounded-lg mt-4">
                <p className="text-sm text-white/80 mb-3">
                  This is just a preview of what you'll get with full access.
                  Get detailed analysis and remediation guidance for all{" "}
                  {data.totalIssuesCount} issues.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={onInstantPurchase}
                    size="sm"
                    className="bg-white hover:bg-white/90 text-black"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Get Full Report
                  </Button>
                  <Button
                    onClick={onUpgrade}
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white bg-black/50 hover:bg-white/10 hover:text-black"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            </div>
          </LockedSectionPreview>
        </div>
      </motion.div>

      {/* Primary Upgrade CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border border-white/20 rounded-xl overflow-hidden bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm"
      >
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-white" />
            <h3 className="text-xl font-semibold text-white">
              Unlock Full Security Analysis
            </h3>
          </div>
          <p className="text-sm text-white/70 mt-2">
            Get detailed insights, all security issues, and comprehensive risk
            assessment
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instant Credits Option */}
            <div className="space-y-4 p-4 rounded-lg border border-white/15 bg-black/30">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Instant Credits</h4>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  Popular
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-white">
                  ${instantPrice}
                </div>
                <p className="text-sm text-white/70">
                  {data.upgradeOptions.instantReport.description}
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2 text-white/80">
                    <TrendingUp className="h-4 w-4 text-white" />
                    All {data.totalIssuesCount} security issues
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <Shield className="h-4 w-4 text-white" />
                    Detailed risk analysis
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <Clock className="h-4 w-4 text-white" />
                    {data.upgradeOptions.instantReport.validFor} access
                  </li>
                </ul>
              </div>
              <Button
                onClick={onInstantPurchase}
                className="w-full bg-white hover:bg-neutral-100 text-black border border-white/20"
              >
                <Zap className="h-4 w-4 mr-2" />
                Get Instant Credits
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Pro Subscription Option */}
            <div className="space-y-4 p-4 rounded-lg border border-white/15 bg-black/30">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Pro Subscription</h4>
                <Badge
                  variant="outline"
                  className="border-white/30 text-white bg-black/50"
                >
                  Best Value
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-white">
                  ${monthlyPrice}/month
                  <span className="text-sm font-normal text-white/70 ml-1">
                    (${dailyProCost.toFixed(2)}/day)
                  </span>
                </div>
                <p className="text-sm text-white/70">
                  {data.upgradeOptions.proSubscription.description}
                </p>
                <ul className="text-sm space-y-2">
                  {data.upgradeOptions.proSubscription.features
                    .slice(0, 3)
                    .map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-white/80"
                      >
                        <Shield className="h-4 w-4 text-white" />
                        {feature}
                      </li>
                    ))}
                </ul>
              </div>
              <Button
                onClick={onUpgrade}
                variant="outline"
                className="w-full bg-black hover:bg-neutral-100 text-white border border-white/20"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade to Pro
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-6"
      >
        <p className="text-sm text-white/70">
          Need help choosing?{" "}
          <a
            href="mailto:contact@contractguard.ai"
            className="text-white cursor-pointer hover:text-white/80 hover:underline transition-colors"
          >
            Contact support
          </a>
        </p>

        {/* Locked Section Previews using LockedCard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LockedCard>
            <div className="p-4 space-y-3">
              <div className="text-sm text-white/70 mb-3">
                Comprehensive holder analysis including:
              </div>
              <div className="space-y-2">
                <div className="text-xs text-white/60">
                  • Top 10 holder concentration analysis
                </div>
                <div className="text-xs text-white/60">
                  • Whale movement tracking
                </div>
                <div className="text-xs text-white/60">
                  • Holder distribution charts
                </div>
                <div className="text-xs text-white/60">
                  • Balance history and trends
                </div>
              </div>
            </div>
          </LockedCard>

          <LockedCard>
            <div className="p-4 space-y-3">
              <div className="text-sm text-white/70 mb-3">
                Detailed liquidity assessment covering:
              </div>
              <div className="space-y-2">
                <div className="text-xs text-white/60">
                  • Multi-DEX liquidity aggregation
                </div>
                <div className="text-xs text-white/60">
                  • 24h volume analysis
                </div>
                <div className="text-xs text-white/60">
                  • Pool lock status verification
                </div>
                <div className="text-xs text-white/60">
                  • Price impact calculations
                </div>
              </div>
            </div>
          </LockedCard>

          <LockedCard>
            <div className="p-4 space-y-3">
              <div className="text-sm text-white/70 mb-3">
                Advanced contract inspection featuring:
              </div>
              <div className="space-y-2">
                <div className="text-xs text-white/60">
                  • Function-level security audit
                </div>
                <div className="text-xs text-white/60">
                  • Gas optimization analysis
                </div>
                <div className="text-xs text-white/60">
                  • Upgradability assessment
                </div>
                <div className="text-xs text-white/60">
                  • Code quality metrics
                </div>
              </div>
            </div>
          </LockedCard>
        </div>
      </motion.div>
    </div>
  );
}
