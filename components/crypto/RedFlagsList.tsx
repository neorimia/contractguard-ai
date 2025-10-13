"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { RiskFlag } from "@/db/schema";

interface RedFlagsListProps {
  flags: RiskFlag[];
}

export function RedFlagsList({ flags }: RedFlagsListProps) {
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  if (!flags || flags.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-3 text-green-500">
          <AlertCircle className="h-6 w-6" />
          <p className="text-lg font-medium">No critical red flags detected</p>
        </div>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          badge: "bg-red-500 text-white",
        };
      case "high":
        return {
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          badge: "bg-orange-500 text-white",
        };
      case "medium":
        return {
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          badge: "bg-yellow-500 text-black",
        };
      default:
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          badge: "bg-blue-500 text-white",
        };
    }
  };

  return (
    <div className="space-y-4">
      {flags.map((flag, index) => {
        const config = getSeverityConfig(flag.severity);
        const isExpanded = expandedFlag === flag.type;

        return (
          <motion.div
            key={`${flag.type}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              border rounded-xl overflow-hidden
              ${config.borderColor} ${config.bgColor}
            `}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedFlag(isExpanded ? null : flag.type)}
              className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`
                  px-3 py-1 rounded-full text-xs font-bold uppercase
                  ${config.badge}
                `}
                >
                  {flag.severity}
                </div>
                <div className="text-left">
                  <h4 className={`font-semibold ${config.color}`}>
                    {flag.title}
                  </h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    Confidence: {flag.confidence}%
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className={`h-5 w-5 ${config.color}`} />
              ) : (
                <ChevronDown className={`h-5 w-5 ${config.color}`} />
              )}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-4 border-t border-neutral-800">
                    {/* Description */}
                    <div className="pt-4">
                      <h5 className="text-sm font-semibold text-neutral-400 mb-2">
                        Description
                      </h5>
                      <p className="text-neutral-300 leading-relaxed">
                        {flag.description}
                      </p>
                    </div>

                    {/* Evidence */}
                    {flag.evidence && (
                      <div>
                        <h5 className="text-sm font-semibold text-neutral-400 mb-2">
                          Evidence
                        </h5>
                        <div className="p-3 bg-neutral-900 rounded-lg font-mono text-sm text-neutral-300 overflow-x-auto">
                          {flag.evidence}
                        </div>
                      </div>
                    )}

                    {/* Confidence Bar */}
                    <div>
                      <h5 className="text-sm font-semibold text-neutral-400 mb-2">
                        Detection Confidence
                      </h5>
                      <div className="relative w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${flag.confidence}%` }}
                          transition={{ duration: 0.5 }}
                          className={config.color.replace("text-", "bg-")}
                          style={{ height: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
