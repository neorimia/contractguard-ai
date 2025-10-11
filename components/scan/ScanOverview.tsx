// components/scan/ScanOverview.tsx
"use client";

import { Shield, CheckCircle, Infinity, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface ScanOverviewProps {
  scansPerformed: number;
  scansRemaining: number;
  maxScans: number;
  tier?: string;
  instantCredits?: number;
  isAnonymous?: boolean;
}

export function ScanOverview({
  scansPerformed,
  scansRemaining,
  maxScans = 3,
  tier = "free",
  instantCredits = 0,
  isAnonymous = false,
}: ScanOverviewProps) {
  // Debug logging
  console.log("ScanOverview render:", {
    scansPerformed,
    scansRemaining,
    tier,
    instantCredits,
    isAnonymous,
  });

  // For Pro/Team users with unlimited scans
  const isUnlimited =
    tier === "pro" || tier === "team" || tier === "enterprise";

  // Always show the component to create awareness
  // No early return - show for everyone

  const percentage = isUnlimited ? 100 : (scansPerformed / maxScans) * 100;
  const isLimitReached =
    scansRemaining === 0 && !isUnlimited && instantCredits === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-2xl mx-auto mt-6"
    >
      <div className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isUnlimited ? (
              <Infinity className="w-4 h-4 text-primary" />
            ) : instantCredits > 0 ? (
              <Sparkles className="w-4 h-4 text-primary" />
            ) : (
              <Shield className="w-4 h-4 text-white/60 dark:text-black/60" />
            )}
            <span className="text-sm font-medium text-white/80 dark:text-black/80">
              {isUnlimited
                ? "Unlimited Scans"
                : instantCredits > 0
                  ? "Instant Credits"
                  : isAnonymous
                    ? "Free Trial Scans"
                    : "Free Scans Today"}
            </span>
          </div>
          <span className="text-sm font-semibold text-white dark:text-black">
            {isUnlimited ? (
              <span className="flex items-center gap-1">
                <Infinity className="w-4 h-4" />
                {tier === "pro"
                  ? "Pro"
                  : tier === "team"
                    ? "Team"
                    : "Unlimited"}
              </span>
            ) : instantCredits > 0 ? (
              <span>{instantCredits} credits</span>
            ) : (
              <span>
                {scansPerformed} / {maxScans}
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar (only for limited scans) */}
        {!isUnlimited && (
          <div className="relative h-2 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: instantCredits > 0 ? "100%" : `${percentage}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                instantCredits > 0
                  ? "bg-primary"
                  : isLimitReached
                    ? "bg-red-500"
                    : scansRemaining === 1
                      ? "bg-amber-500"
                      : "bg-green-500"
              }`}
            />
          </div>
        )}

        {/* Status Message */}
        <div className="mt-3 flex items-center justify-between text-xs">
          {isUnlimited ? (
            <>
              <span className="text-primary font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Scan as much as you want
              </span>
              <span className="text-white/40 dark:text-black/40">
                {tier === "pro"
                  ? "$29/mo"
                  : tier === "team"
                    ? "$99/mo"
                    : "Premium"}
              </span>
            </>
          ) : instantCredits > 0 ? (
            <>
              <span className="text-primary font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Using instant credits
              </span>
              <span className="text-white/40 dark:text-black/40">
                {scansRemaining} free scans left
              </span>
            </>
          ) : isLimitReached ? (
            <>
              <span className="text-red-400 dark:text-red-500 font-medium">
                ⚠️ No scans remaining
              </span>
              <span className="text-white/40 dark:text-black/40">
                {isAnonymous ? "Sign up for 3 daily" : "Upgrade or buy credits"}
              </span>
            </>
          ) : scansRemaining === 1 ? (
            <>
              <span className="text-amber-400 dark:text-amber-500 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {scansRemaining} scan remaining
              </span>
              <span className="text-white/40 dark:text-black/40">
                {isAnonymous ? "Sign up for 3 daily" : "Resets tomorrow"}
              </span>
            </>
          ) : (
            <>
              <span className="text-green-400 dark:text-green-500 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {scansRemaining} scans remaining
              </span>
              <span className="text-white/40 dark:text-black/40">
                {isAnonymous ? "Sign up for 3 daily" : "Resets tomorrow"}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
