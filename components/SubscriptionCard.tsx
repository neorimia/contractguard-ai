"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Crown, Zap, Loader2 } from "lucide-react";

interface SubscriptionCardProps {
  userTier: "free" | "pro" | "enterprise";
  loadingPortal: boolean;
  onManageSubscription: () => void;
  onUpgrade: () => void;
  isLoading?: boolean;
}

export function SubscriptionCard({
  userTier,
  loadingPortal,
  onManageSubscription,
  onUpgrade,
  isLoading = false,
}: SubscriptionCardProps) {
  if (isLoading) {
    return <SubscriptionCardSkeleton />;
  }

  return (
    <div className="mb-6 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Current Plan
              </h3>
              {userTier !== "free" && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    userTier === "enterprise"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {userTier === "enterprise" ? (
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Enterprise
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Pro
                    </span>
                  )}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-black dark:text-white mb-1">
              {userTier === "free" && "Free Tier"}
              {userTier === "pro" && "Pro Tier"}
              {userTier === "enterprise" && "Enterprise"}
            </p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {userTier === "free" && "3 scans per day • Basic features"}
              {userTier === "pro" && "100 scans per day • All Pro features"}
              {userTier === "enterprise" &&
                "Unlimited scans • Enterprise features"}
            </p>
          </div>

          {/* Manage Subscription Button (Only for paid tiers) */}
          {userTier !== "free" && (
            <Button
              onClick={onManageSubscription}
              disabled={loadingPortal}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              {loadingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          )}

          {/* Upgrade Button (Only for free tier) */}
          {userTier === "free" && (
            <Button
              onClick={onUpgrade}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionCardSkeleton() {
  return (
    <div className="mb-6 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
            </div>

            {/* Title skeleton */}
            <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />

            {/* Description skeleton */}
            <div className="h-4 w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-10 w-40 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
