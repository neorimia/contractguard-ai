"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle,
  Shield,
  Info,
} from "lucide-react";
import { Audit, Issue } from "@/db/schema";
import ShareOnX from "@/components/ShareOnX";

interface ScanResultsProps {
  result: Audit;
  contractAddress?: string;
}

interface ResultSection {
  id: string;
  title: string;
  count?: number;
}

export default function ScanResults({
  result,
  contractAddress,
}: ScanResultsProps) {
  const [expandedSection, setExpandedSection] = useState<string>("overview");

  // Categorize issues
  const criticalIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "CRITICAL") || [];
  const highIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "HIGH") || [];
  const mediumIssues =
    (result.issues as Issue[])?.filter((i) => i.severity === "MEDIUM") || [];

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-orange-500";
    return "text-green-500";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "HIGH RISK";
    if (score >= 40) return "MEDIUM RISK";
    return "LOW RISK";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 70) return <AlertTriangle className="h-6 w-6 text-red-500" />;
    if (score >= 40)
      return <AlertTriangle className="h-6 w-6 text-orange-500" />;
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const sections: ResultSection[] = [
    { id: "overview", title: "Risk Overview", count: 1 },
    { id: "critical", title: "Critical Issues", count: criticalIssues.length },
    { id: "high", title: "High Severity Issues", count: highIssues.length },
    {
      id: "medium",
      title: "Medium Severity Issues",
      count: mediumIssues.length,
    },
    { id: "details", title: "Contract Details" },
    { id: "code", title: "Source Code" },
    { id: "metadata", title: "Audit Metadata" },
  ];

  return (
    <section className="py-24 sm:py-32 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <div className="flex h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-medium">Security Analysis</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-baseline justify-between flex-wrap gap-4"
          >
            <h2 className="text-6xl sm:text-7xl font-semibold tracking-tight">
              Results
              <span className="text-neutral-500">.</span>
              <span className="ml-4 text-neutral-500">
                ({sections.filter((s) => s.count && s.count > 0).length})
              </span>
            </h2>
            <ShareOnX result={result} contractAddress={contractAddress} />
          </motion.div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {/* Overview Section */}
          <SectionItem
            section={{ id: "overview", title: "Risk Overview" }}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <div className="pb-8 space-y-8">
              {/* Risk Score Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Risk Score */}
                <div className="relative overflow-hidden rounded-xl bg-neutral-900 p-8 text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-center">
                      {getRiskIcon(result.riskScore || 0)}
                    </div>
                    <div
                      className={`text-6xl font-bold ${getRiskColor(result.riskScore || 0)}`}
                    >
                      {result.riskScore}
                    </div>
                    <div className="text-white/70 font-medium">
                      {getRiskLabel(result.riskScore || 0)}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="relative overflow-hidden rounded-xl bg-neutral-900 p-8 text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                  <div className="relative space-y-4">
                    <div className="text-4xl">
                      {result.recommendation === "AVOID" && "🚫"}
                      {result.recommendation === "CAUTION" && "⚠️"}
                      {result.recommendation === "BUY" && "✅"}
                    </div>
                    <div className="text-2xl font-semibold">
                      {result.recommendation}
                    </div>
                    <div className="text-sm text-white/60">Recommendation</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-neutral-900 p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Analysis Summary
                </h4>
                <p className="text-neutral-400 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>
          </SectionItem>

          {/* Critical Issues */}
          {criticalIssues.length > 0 && (
            <SectionItem
              section={{
                id: "critical",
                title: "Critical Issues",
                count: criticalIssues.length,
              }}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <IssuesContent
                issues={criticalIssues}
                color="red"
                severity="CRITICAL"
              />
            </SectionItem>
          )}

          {/* High Severity Issues */}
          {highIssues.length > 0 && (
            <SectionItem
              section={{
                id: "high",
                title: "High Severity Issues",
                count: highIssues.length,
              }}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <IssuesContent
                issues={highIssues}
                color="orange"
                severity="HIGH"
              />
            </SectionItem>
          )}

          {/* Medium Severity Issues */}
          {mediumIssues.length > 0 && (
            <SectionItem
              section={{
                id: "medium",
                title: "Medium Severity Issues",
                count: mediumIssues.length,
              }}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <IssuesContent
                issues={mediumIssues}
                color="yellow"
                severity="MEDIUM"
              />
            </SectionItem>
          )}

          {/* Contract Details */}
          <SectionItem
            section={{ id: "details", title: "Contract Details" }}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <div className="pb-8 space-y-6">
              {/* Main Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <DetailCard
                  icon="📝"
                  label="Contract Address"
                  value={contractAddress || result.contractAddress || "N/A"}
                  mono
                />
                <DetailCard
                  icon="⛓️"
                  label="Blockchain"
                  value={
                    result.chain
                      ? result.chain.charAt(0).toUpperCase() +
                        result.chain.slice(1)
                      : "N/A"
                  }
                />
                <DetailCard
                  icon={result.isVerified ? "✅" : "❌"}
                  label="Verified"
                  value={result.isVerified ? "Yes" : "No"}
                />
              </div>

              {/* Token Metrics */}
              <div className="grid md:grid-cols-3 gap-6">
                <DetailCard
                  icon="👥"
                  label="Holders"
                  value={result.holderCount?.toLocaleString() || "N/A"}
                />
                <DetailCard
                  icon="💧"
                  label="Liquidity"
                  value={result.liquidity || "N/A"}
                />
                <DetailCard
                  icon="💰"
                  label="Owner Balance"
                  value={result.ownerBalance || "N/A"}
                />
              </div>
            </div>
          </SectionItem>

          {/* Source Code */}
          {result.sourceCode && (
            <SectionItem
              section={{ id: "code", title: "Source Code" }}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
            >
              <div className="pb-8 space-y-4">
                <div className="rounded-xl bg-neutral-900 p-6 border border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Contract Source Code
                    </h4>
                    <span className="text-xs text-neutral-500">
                      {result.isVerified ? "✅ Verified" : "❌ Not Verified"}
                    </span>
                  </div>
                  <pre className="p-4 bg-black/40 rounded-lg text-xs text-neutral-300 overflow-x-auto border border-neutral-800 font-mono max-h-96 overflow-y-auto">
                    {result.sourceCode}
                  </pre>
                </div>

                {result.bytecode && (
                  <div className="rounded-xl bg-neutral-900 p-6 border border-neutral-800">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Bytecode
                    </h4>
                    <pre className="p-4 bg-black/40 rounded-lg text-xs text-neutral-300 overflow-x-auto border border-neutral-800 font-mono max-h-48 overflow-y-auto break-all">
                      {result.bytecode}
                    </pre>
                  </div>
                )}
              </div>
            </SectionItem>
          )}

          {/* Audit Metadata */}
          <SectionItem
            section={{ id: "metadata", title: "Audit Metadata" }}
            expandedSection={expandedSection}
            setExpandedSection={setExpandedSection}
          >
            <div className="pb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <DetailCard
                  icon="📅"
                  label="Scanned At"
                  value={
                    result.createdAt
                      ? new Date(result.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"
                  }
                />
                <DetailCard
                  icon="👁️"
                  label="Views"
                  value={result.views?.toLocaleString() || "0"}
                />
                <DetailCard
                  icon="🔄"
                  label="Shares"
                  value={result.shares?.toLocaleString() || "0"}
                />
              </div>
            </div>
          </SectionItem>
        </div>
      </div>
    </section>
  );
}

// Section Item Component
function SectionItem({
  section,
  expandedSection,
  setExpandedSection,
  children,
}: {
  section: ResultSection;
  expandedSection: string;
  setExpandedSection: (id: string) => void;
  children: React.ReactNode;
}) {
  const isExpanded = expandedSection === section.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group border-t border-neutral-800 relative"
    >
      {/* Background hover effect */}
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Collapsed State - Clickable Row */}
      <button
        type="button"
        onClick={() => setExpandedSection(isExpanded ? "" : section.id)}
        className="w-full py-6 flex items-center justify-between relative"
        aria-label={isExpanded ? "Show less" : "Show more"}
      >
        <div className="flex items-center gap-6">
          <AnimatePresence mode="wait">
            {!isExpanded && (
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xl font-medium group-hover:text-neutral-200 transition-colors duration-200"
              >
                {section.title}
                {section.count !== undefined && section.count > 0 && (
                  <span className="ml-3 text-sm text-neutral-500 font-mono">
                    ({section.count})
                  </span>
                )}
              </motion.h3>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center w-8 h-8">
          {isExpanded ? (
            <Minus className="w-5 h-5 text-neutral-500 group-hover:text-neutral-400 transition-colors duration-200" />
          ) : (
            <Plus className="w-5 h-5 text-neutral-500 group-hover:text-neutral-400 transition-colors duration-200" />
          )}
        </div>
      </button>

      {/* Expanded State */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden relative"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Issues Content Component
function IssuesContent({
  issues,
  color,
  severity,
}: {
  issues: Issue[];
  color: "red" | "orange" | "yellow";
  severity: string;
}) {
  const colorClasses = {
    red: "bg-red-950/40 border-red-800/50",
    orange: "bg-orange-950/40 border-orange-800/50",
    yellow: "bg-yellow-950/40 border-yellow-800/50",
  };

  const textColorClasses = {
    red: "text-red-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
  };

  return (
    <div className="pb-8 space-y-4">
      {issues.map((issue, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`p-6 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between mb-4">
            <h4 className={`text-lg font-semibold ${textColorClasses[color]}`}>
              {issue.type}
            </h4>
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
              {issue.severity}
            </span>
          </div>
          <p className="text-neutral-300 mb-4 leading-relaxed">
            {issue.description}
          </p>
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-neutral-400">💡 Impact:</span>
            <span className={`font-medium ${textColorClasses[color]}`}>
              {issue.impact}
            </span>
          </div>
          {issue.code && (
            <pre className="p-4 bg-black/40 rounded-lg text-xs text-neutral-300 overflow-x-auto border border-neutral-800 font-mono">
              {issue.code}
            </pre>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Detail Card Component
interface DetailCardProps {
  icon: string;
  label: string;
  value: string | number;
  mono?: boolean;
}

function DetailCard({ icon, label, value, mono = false }: DetailCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-neutral-900 p-6 text-center hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
      <div className="relative space-y-3">
        <div className="text-3xl">{icon}</div>
        <div className="text-sm text-white/60">{label}</div>
        <div
          className={`text-xl font-semibold ${mono ? "font-mono text-sm truncate" : ""}`}
          title={mono ? String(value) : undefined}
        >
          {value}
        </div>
      </div>
    </motion.div>
  );
}
