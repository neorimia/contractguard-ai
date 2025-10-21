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
  // For Team/Enterprise users with unlimited scans (Pro has 100/day limit)
  const isUnlimited = tier === "team" || tier === "enterprise";

  // Always show the component to create awareness
  // No early return - show for everyone

  // Calculate percentage based on what's being used
  const percentage = isUnlimited
    ? 100
    : instantCredits > 0
      ? 0 // Don't show progress bar for instant credits (they're unlimited until depleted)
      : tier === "pro"
        ? (scansPerformed / 100) * 100
        : (scansPerformed / maxScans) * 100;

  const isLimitReached =
    scansRemaining === 0 && !isUnlimited && instantCredits === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-2xl mx-auto mt-6"
    >
      <div className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/20 dark:border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isUnlimited ? (
              <Infinity className="w-4 h-4 text-white/60 dark:text-white/60" />
            ) : instantCredits > 0 ? (
              <Sparkles className="w-4 h-4 text-white/60 dark:text-white/60" />
            ) : (
              <Shield className="w-4 h-4 text-white/60 dark:text-white/60" />
            )}
            <span className="text-sm font-medium text-white/80 dark:text-white/80">
              {isUnlimited
                ? "Unlimited Scans"
                : tier === "pro"
                  ? "Pro Scans Today"
                  : instantCredits > 0
                    ? "Instant Credits"
                    : isAnonymous
                      ? "Free Trial Scans"
                      : "Free Scans Today"}
            </span>
          </div>
          <span className="text-sm font-semibold text-white dark:text-white">
            {isUnlimited ? (
              <span className="flex items-center gap-1">
                <Infinity className="w-4 h-4" />
                {tier === "team" ? "Team" : "Unlimited"}
              </span>
            ) : tier === "pro" ? (
              <span>{scansPerformed} / 100</span>
            ) : instantCredits > 0 ? (
              <span>{instantCredits} credits</span>
            ) : (
              <span>
                {scansPerformed} / {maxScans}
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar (only for limited scans, not for instant credits) */}
        {!isUnlimited && instantCredits === 0 && (
          <div className="relative h-2 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${percentage}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isLimitReached
                  ? "bg-red-500"
                  : scansRemaining === 1
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
            />
          </div>
        )}

        {/* Instant Credits Indicator */}
        {instantCredits > 0 && (
          <div className="relative h-2 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        )}

        {/* Status Message */}
        <div className="mt-3 flex items-center justify-between text-xs">
          {isUnlimited ? (
            <>
              <span className="text-white/80 dark:text-white/80 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Scan as much as you want
              </span>
              <span className="text-white/40 dark:text-white/40">
                {tier === "team" ? "$99/mo" : "Premium"}
              </span>
            </>
          ) : instantCredits > 0 ? (
            <>
              <span className="text-white/80 dark:text-white/80 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {instantCredits} instant credit{instantCredits === 1 ? "" : "s"}{" "}
                available
              </span>
              <span className="text-white/40 dark:text-white/40">
                {scansRemaining > 0
                  ? `${scansRemaining} free scans left`
                  : "No free scans left"}
              </span>
            </>
          ) : isLimitReached ? (
            <>
              <span className="text-red-400 dark:text-red-500 font-medium">
                ⚠️ No scans remaining
              </span>
              <span className="text-white/40 dark:text-white/40">
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
