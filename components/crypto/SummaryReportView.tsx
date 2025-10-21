"use client";

import { useState } from "react";
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
  const [showLockedContent, setShowLockedContent] = useState(false);

  const getRiskConfig = (category: string) => {
    switch (category) {
      case "critical":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          icon: AlertTriangle,
          label: "CRITICAL RISK",
          textColor: "text-red-600",
        };
      case "high":
        return {
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          icon: AlertTriangle,
          label: "HIGH RISK",
          textColor: "text-orange-600",
        };
      case "medium":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          icon: AlertTriangle,
          label: "MEDIUM RISK",
          textColor: "text-yellow-600",
        };
      case "low":
        return {
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          icon: Shield,
          label: "LOW RISK",
          textColor: "text-green-600",
        };
      default:
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          icon: Shield,
          label: "VERY LOW RISK",
          textColor: "text-blue-600",
        };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const riskConfig = getRiskConfig(data.riskCategory);
  const RiskIcon = riskConfig.icon;

  // Calculate savings for instant report vs subscription
  const instantPrice = data.upgradeOptions.instantReport.price / 100;
  const monthlyPrice = data.upgradeOptions.proSubscription.price / 100;
  const dailyInstantCost = instantPrice; // Assuming 1 report per day
  const dailyProCost = monthlyPrice / 30;

  return (
    <div className="space-y-6">
      {/* Risk Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card
          className={`${riskConfig.bgColor} ${riskConfig.borderColor} border-2`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${riskConfig.bgColor}`}>
                  <RiskIcon className={`h-8 w-8 ${riskConfig.color}`} />
                </div>
                <div>
                  <CardTitle className={`text-xl ${riskConfig.textColor}`}>
                    {riskConfig.label}
                  </CardTitle>
                  <CardDescription className="text-sm opacity-80">
                    Confidence: {data.confidence}%
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${riskConfig.textColor}`}>
                  {data.riskScore}
                </div>
                <div className="text-sm opacity-60">/ 100</div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.riskScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full ${riskConfig.color.replace("text-", "bg-")}`}
              />
            </div>

            {/* Recommendation */}
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">
                Recommendation:{" "}
                <span className={riskConfig.textColor}>
                  {data.recommendation}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Basic Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Holders</p>
                <p className="font-semibold">{data.holderCountRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Liquidity</p>
                <p className="font-semibold">{data.liquidityRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-semibold">{data.deployedAge}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Issues Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Top Security Issues
              <Badge variant="outline" className="ml-auto">
                {data.topIssues.length} of {data.totalIssuesCount} shown
              </Badge>
            </CardTitle>
            <CardDescription>
              Get the complete list of {data.totalIssuesCount} security issues
              found
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.topIssues.map((issue, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <Badge className={getSeverityColor(issue.severity)}>
                  {issue.severity.toUpperCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{issue.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {issue.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Locked Content Teaser */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
              <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <div className="flex items-center gap-3 text-gray-500">
                  <Lock className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    +{data.totalIssuesCount - data.topIssues.length} more issues
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Primary Upgrade CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Unlock Full Security Analysis
            </CardTitle>
            <CardDescription>
              Get detailed insights, all security issues, and comprehensive risk
              assessment
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instant Report Option */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Instant Report</h4>
                  <Badge variant="secondary">Popular</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">${instantPrice}</div>
                  <p className="text-sm text-gray-600">
                    {data.upgradeOptions.instantReport.description}
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      All {data.totalIssuesCount} security issues
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Detailed risk analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      {data.upgradeOptions.instantReport.validFor} access
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={onInstantPurchase}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get Instant Report
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Pro Subscription Option */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Pro Subscription</h4>
                  <Badge variant="outline">Best Value</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    ${monthlyPrice}/month
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      (${dailyProCost.toFixed(2)}/day)
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {data.upgradeOptions.proSubscription.description}
                  </p>
                  <ul className="text-sm space-y-1">
                    {data.upgradeOptions.proSubscription.features
                      .slice(0, 3)
                      .map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                </div>
                <Button
                  onClick={onUpgrade}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <p className="text-sm text-gray-600 mb-4">
          Need help choosing?{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">
            Contact support
          </span>
        </p>

        {/* Locked Section Previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            {
              title: "Holder Analysis",
              icon: Users,
              desc: "Top holders distribution",
            },
            {
              title: "Liquidity Analysis",
              icon: DollarSign,
              desc: "Pool depth & stability",
            },
            {
              title: "Contract Details",
              icon: Shield,
              desc: "Source code analysis",
            },
          ].map((section, index) => (
            <div key={index} className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-lg" />
              <div className="relative p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">{section.title}</span>
                </div>
                <p className="text-sm text-gray-500">{section.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
