// components/referrals/ReferralDashboardSkeleton.tsx
"use client";

import { Share2, Trophy, TrendingUp, Gift, Users } from "lucide-react";

export function ReferralDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tier Badge Section Skeleton */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded ml-auto" />
            <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-4 w-28 bg-black/10 dark:bg-white/10 rounded ml-auto" />
          </div>
        </div>

        {/* Current Tier Perks Skeleton */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-4 w-full bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress to Next Tier Skeleton */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded" />
            <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded" />
          </div>
          <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded" />
        </div>
        <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-black/20 dark:bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Referral Link Section Skeleton */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-black/30 dark:text-white/30" />
          <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-black/10 dark:bg-white/10 rounded-lg h-12" />
          <div className="w-12 h-12 bg-black/10 dark:bg-white/10 rounded-lg" />
          <div className="w-24 h-12 bg-black/10 dark:bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Trophy, color: "purple" },
          { icon: TrendingUp, color: "green" },
          { icon: Gift, color: "blue" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full bg-${item.color}-600/20 flex items-center justify-center`}
              >
                <item.icon
                  className={`w-6 h-6 text-${item.color}-600/30 dark:text-${item.color}-400/30`}
                />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Referrals Skeleton */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-black/10 dark:border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-black/30 dark:text-white/30" />
            </div>
            <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Left side */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-black/10 dark:bg-white/10 w-10 h-10" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-black/10 dark:bg-white/10 rounded" />
                      <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded" />
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-6 w-20 bg-black/10 dark:bg-white/10 rounded-full" />
                    {i === 1 && (
                      <div className="h-7 w-24 bg-black/10 dark:bg-white/10 rounded-lg" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Skeleton */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-black/30 dark:text-white/30" />
          <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-black/10 dark:bg-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-4 w-56 bg-black/10 dark:bg-white/10 rounded" />
              </div>
              <div className="h-4 w-20 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
