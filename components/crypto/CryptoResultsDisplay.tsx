"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { CryptoAudit } from "@/db/schema";
import { HeuristicResult } from "@/lib/services/crypto/types";
import { RiskScoreCard } from "./RiskScoreCard";
import { RedFlagsList } from "./RedFlagsList";
import { ContractMetadataCard } from "./ContractMetadataCard";
import { HeuristicsBreakdown } from "./HeuristicsBreakdown";
import { HolderDistributionChart } from "./HolderDistributionChart";
import { LiquidityTimelineChart } from "./LiquidityTimelineChart";
import { LiquidityPoolsDisplay } from "./LiquidityPoolsDisplay";
import { PDFExportButton } from "./PDFExportButton";
import { SummaryReportView } from "./SummaryReportView";
import { ReportResponse } from "@/lib/types/report-types";
import ShareOnX from "@/components/ShareOnX";
import {
  Shield,
  Code,
  Users,
  Droplet,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
} from "lucide-react";

interface CryptoResultsDisplayProps {
  result: CryptoAudit & {
    recommendation?: string;
    heuristicResults?: HeuristicResult[];
  };
  contractAddress?: string;
  reportAccess?: ReportResponse | null;
  onUpgradeClick?: () => void;
  onInstantPurchaseClick?: () => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  count?: number;
}

export function CryptoResultsDisplay({
  result,
  contractAddress,
  reportAccess,
  onUpgradeClick,
  onInstantPurchaseClick,
}: CryptoResultsDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<string>("overview");

  const sections: Section[] = [
    {
      id: "overview",
      title: "Risk Overview",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: "flags",
      title: "Red Flags",
      icon: <Info className="h-5 w-5" />,
      count: result.flags?.length || 0,
    },
    {
      id: "holder-distribution",
      title: "Holder Distribution",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "liquidity-timeline",
      title: "Liquidity Analysis",
      icon: <Droplet className="h-5 w-5" />,
    },
    {
      id: "heuristics",
      title: "Heuristics Breakdown",
      icon: <Code className="h-5 w-5" />,
    },
    {
      id: "metadata",
      title: "Contract Details",
      icon: <Activity className="h-5 w-5" />,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? "" : sectionId);
  };

  // Conditional rendering based on access level
  if (reportAccess && reportAccess.accessLevel === "summary") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-medium">Analysis Complete</span>
            </div>
            <h2 className="text-4xl font-semibold tracking-tight">
              Results<span className="text-neutral-500">.</span>
            </h2>
          </div>
        </div>

        {/* Summary Report View */}
        <SummaryReportView
          data={reportAccess}
          onUpgrade={onUpgradeClick || (() => {})}
          onInstantPurchase={onInstantPurchaseClick || (() => {})}
        />
      </div>
    );
  }

  // Full report view (existing implementation)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight">
            Results<span className="text-neutral-500">.</span>
          </h2>
          <PDFExportButton className="mt-4" result={result} />
        </div>
        <div className="flex items-center gap-3">
          {contractAddress && (
            <ShareOnX
              result={result as any}
              contractAddress={contractAddress}
            />
          )}
        </div>
      </div>

      {/* Risk Score Card */}
      <RiskScoreCard
        riskScore={result.riskScore}
        riskCategory={result.riskCategory || "unknown"}
        confidence={result.confidence || 0}
        recommendation={result.recommendation}
      />

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-neutral-400">{section.icon}</div>
                <h3 className="text-xl font-semibold">{section.title}</h3>
                {section.count !== undefined && (
                  <span className="px-2 py-1 bg-neutral-800 rounded-full text-xs font-medium">
                    {section.count}
                  </span>
                )}
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="h-5 w-5 text-neutral-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-neutral-400" />
              )}
            </button>

            {/* Section Content */}
            {expandedSection === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-neutral-800"
              >
                <div className="p-6">
                  {section.id === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <MetricCard
                        label="Risk Score"
                        value={`${result.riskScore}/100`}
                        icon={<Shield className="h-5 w-5" />}
                      />
                      <MetricCard
                        label="Confidence"
                        value={`${result.confidence}%`}
                        icon={<Info className="h-5 w-5" />}
                      />
                      <MetricCard
                        label="Red Flags"
                        value={result.flags?.length || 0}
                        icon={<Info className="h-5 w-5" />}
                      />
                      <MetricCard
                        label="Holders"
                        value={result.holderCount?.toLocaleString() || "N/A"}
                        icon={<Users className="h-5 w-5" />}
                      />
                      <MetricCard
                        label="Top 10 Concentration"
                        value={
                          result.topHolderConcentration != null &&
                          result.topHolderConcentration !== ""
                            ? `${result.topHolderConcentration}%`
                            : "N/A"
                        }
                        icon={<Users className="h-5 w-5" />}
                      />
                      <MetricCard
                        label="Liquidity"
                        value={result.liquidityUsd || "N/A"}
                        icon={<Droplet className="h-5 w-5" />}
                      />
                    </div>
                  )}

                  {section.id === "flags" && (
                    <RedFlagsList flags={result.flags || []} />
                  )}

                  {section.id === "holder-distribution" && (
                    <>
                      {(result as any).holderData?.topHolders ? (
                        <HolderDistributionChart
                          holders={(result as any).holderData.topHolders}
                          totalSupply={(result as any).holderData.totalSupply}
                        />
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Holder distribution data not available</p>
                          <p className="text-sm mt-1">
                            This feature requires additional blockchain data
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {section.id === "liquidity-timeline" && (
                    <>
                      {(result as any).liquidityData?.liquidityPairs &&
                      (result as any).liquidityData.liquidityPairs.length >
                        0 ? (
                        <LiquidityPoolsDisplay
                          totalLiquidityUsd={
                            (result as any).liquidityData.totalLiquidityUsd ||
                            result.liquidityUsd ||
                            "0"
                          }
                          liquidityPairs={
                            (result as any).liquidityData.liquidityPairs
                          }
                          isLocked={(result as any).liquidityData.isLocked}
                          poolCount={(result as any).liquidityData.poolCount}
                        />
                      ) : (result as any).liquidityData?.events &&
                        (result as any).liquidityData.events.length > 0 ? (
                        <LiquidityTimelineChart
                          events={(result as any).liquidityData.events}
                          currentLiquidity={Number(result.liquidityUsd) || 0}
                          lockExpiration={
                            (result as any).liquidityData.lockExpiration
                          }
                        />
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Liquidity data not available</p>
                          <p className="text-sm mt-1">
                            Unable to fetch liquidity information for this token
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {section.id === "heuristics" && result.heuristicResults && (
                    <HeuristicsBreakdown results={result.heuristicResults} />
                  )}

                  {section.id === "metadata" && (
                    <ContractMetadataCard
                      metadata={result.metadata || undefined}
                      isVerified={result.isVerified || false}
                      chain={result.chain}
                      address={result.contractAddress}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Helper component for metrics
function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-neutral-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2 text-neutral-400">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
