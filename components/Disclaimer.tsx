"use client";

import { AlertTriangle, Shield, Info } from "lucide-react";
import { motion } from "motion/react";

interface DisclaimerProps {
  variant?: "default" | "compact" | "warning";
  className?: string;
}

export function Disclaimer({ variant = "default", className = "" }: DisclaimerProps) {
  const variants = {
    default: {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Important Disclaimer",
      content: "This analysis is for informational purposes only and does not constitute financial advice. Always conduct your own research (DYOR) before making investment decisions.",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-800/30",
      textColor: "text-yellow-800 dark:text-yellow-200",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    compact: {
      icon: <Info className="h-4 w-4" />,
      title: "",
      content: "Not financial advice. Always DYOR.",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800/30",
      textColor: "text-blue-800 dark:text-blue-200",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    warning: {
      icon: <Shield className="h-5 w-5" />,
      title: "Security Notice",
      content: "Smart contract analysis is not 100% accurate. False positives and false negatives may occur. This tool is supplementary to your own research and should not be your only source of information.",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800/30",
      textColor: "text-red-800 dark:text-red-200",
      iconColor: "text-red-600 dark:text-red-400",
    },
  };

  const current = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 rounded-lg border ${current.bgColor} ${current.borderColor} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${current.iconColor} flex-shrink-0 mt-0.5`}>
          {current.icon}
        </div>
        <div className="flex-1">
          {current.title && (
            <h4 className={`font-semibold text-sm ${current.textColor} mb-1`}>
              {current.title}
            </h4>
          )}
          <p className={`text-sm ${current.textColor}`}>
            {current.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Crypto-specific disclaimer for security analysis
export function CryptoDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Disclaimer variant="default" />
      <Disclaimer variant="warning" />
    </div>
  );
}

// Trust indicators for crypto security
export function SecurityTrustIndicators() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm text-black/60 dark:text-white/60">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span>Enterprise Security</span>
      </div>
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span>No Data Storage</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <span>Always DYOR</span>
      </div>
    </div>
  );
}
