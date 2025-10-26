"use client";

import { memo } from "react";
import type { UsageData } from "../schemas";

interface UsageStatsProps {
  usage: UsageData | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const UsageStats = memo(function UsageStats({ usage }: UsageStatsProps) {
  if (!usage) {
    return null;
  }

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Usage Statistics
        </h3>

        <div>
          <p className="text-sm text-black/60 dark:text-white/60 mb-1">
            Today
          </p>
          <p className="text-2xl font-bold text-black dark:text-white mb-2">
            {usage.current.scansToday} /{" "}
            {usage.current.limit === 999999 ? "∞" : usage.current.limit} scans
          </p>

          {usage.current.limit !== 999999 && (
            <>
              <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-black dark:bg-white transition-all duration-500"
                  style={{
                    width: `${Math.min((usage.current.scansToday / usage.current.limit) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-black/60 dark:text-white/60">
                Resets {formatDate(usage.current.resetAt)}
              </p>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-black/60 dark:text-white/60">
              This Month
            </span>
            <span className="font-semibold text-black dark:text-white">
              {usage.current.scansThisMonth} scans
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
