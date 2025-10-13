"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { CryptoAudit } from "@/db/schema";
import { HeuristicResult } from "@/lib/services/crypto/types";
import { RiskScoreCard } from "./RiskScoreCard";
import { RedFlagsList } from "./RedFlagsList";
import { ContractMetadataCard } from "./ContractMetadataCard";
import { HeuristicsBreakdown } from "./HeuristicsBreakdown";
import ShareOnX from "@/components/ShareOnX";
import {
  Shield,
  Code,
  Users,
  Droplet,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CryptoResultsDisplayProps {
  result: CryptoAudit & {
    recommendation?: string;
    heuristicResults?: HeuristicResult[];
  };
  contractAddress?: string;
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
      id: "heuristics",
      title: "Heuristics Breakdown",
      icon: <Code className="h-5 w-5" />,
    },
    {
      id: "metadata",
      title: "Contract Details",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? "" : sectionId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight">
            Results<span className="text-neutral-500">.</span>
          </h2>
        </div>
        {contractAddress && (
          <ShareOnX result={result as any} contractAddress={contractAddress} />
        )}
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
                          result.topHolderConcentration
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
