"use client";

import { Shield, Lock, Eye } from "lucide-react";
import { motion } from "motion/react";

interface TrustBadgeProps {
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function TrustBadge({
  variant = "default",
  className = "",
}: TrustBadgeProps) {
  const variants = {
    default: {
      icon: <Shield className="h-5 w-5" />,
      text: "Encrypted results, we don't store your contract addresses",
      description: "Your privacy is protected with enterprise-grade security",
    },
    compact: {
      icon: <Lock className="h-4 w-4" />,
      text: "Encrypted & Private",
      description: "",
    },
    detailed: {
      icon: <Eye className="h-5 w-5" />,
      text: "Privacy-First Analysis",
      description:
        "We only read public blockchain data and never store your contract addresses. All analysis is encrypted and processed securely.",
    },
  };

  const current = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg ${className}`}
    >
      <div className="text-green-600 dark:text-green-400">{current.icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-green-800 dark:text-green-200">
          {current.text}
        </span>
        {current.description && (
          <span className="text-xs text-green-600 dark:text-green-400">
            {current.description}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Trust indicators component for footer
export function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-black/60 dark:text-white/60">
      <div className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        <span>SSL Encrypted</span>
      </div>
      <div className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        <span>No Data Storage</span>
      </div>
      <div className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        <span>Privacy First</span>
      </div>
    </div>
  );
}
