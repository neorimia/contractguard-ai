"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { SubscriptionData } from "../schemas";

interface SubscriptionCardProps {
  subscription: SubscriptionData | null;
  userTier: "free" | "starter" | "pro" | "team";
  onCancelClick: () => void;
  onReactivate: () => void;
  loadingReactivate: boolean;
}

export const SubscriptionCard = memo(function SubscriptionCard({
  subscription,
  userTier,
  onCancelClick,
  onReactivate,
  loadingReactivate,
}: SubscriptionCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const progress = useMemo(() => {
    if (
      !subscription ||
      !subscription.currentPeriodStart ||
      !subscription.currentPeriodEnd
    )
      return 0;

    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();

    const total = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  }, [subscription]);

  if (!subscription) {
    return (
      <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] p-6">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Free Tier
        </h2>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">
          Upgrade to unlock monthly credits and advanced features
        </p>
        <Button
          className="w-full bg-black dark:bg-white text-white dark:text-black"
          onClick={() => router.push("/pricing")}
        >
          <Zap className="mr-2 h-4 w-4" />
          View Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Current Subscription
          </h2>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              userTier === "team"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : userTier === "pro"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            }`}
          >
            {userTier === "team" ? (
              <>
                <Crown className="h-3 w-3" />
                Team
              </>
            ) : userTier === "pro" ? (
              <>
                <Zap className="h-3 w-3" />
                Pro
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Starter
              </>
            )}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-2xl font-bold text-black dark:text-white capitalize">
            {userTier} Plan
          </h3>
          {subscription.amount && subscription.interval && (
            <span className="text-xl font-semibold text-black dark:text-white">
              ${(subscription.amount / 100).toFixed(2)}/{subscription.interval}
            </span>
          )}
        </div>

        {subscription.currentPeriodEnd && (
          <p className="text-sm text-black/60 dark:text-white/60 mb-6">
            Next billing date: {formatDate(subscription.currentPeriodEnd)}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
            <span>Billing Cycle Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-black dark:bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5 mb-6">
          <div className="flex items-center gap-2 text-sm text-black dark:text-white">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>
              {userTier === "starter"
                ? "30 scans/month (≈1 per day)"
                : userTier === "pro"
                  ? "150 scans/month (≈5 per day)"
                  : "1,000 scans/month"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-black dark:text-white">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>Email alerts for watched contracts</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-black dark:text-white">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>PDF export functionality</span>
          </div>
          {(userTier === "pro" || userTier === "team") && (
            <div className="flex items-center gap-2 text-sm text-black dark:text-white">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Priority support</span>
            </div>
          )}
          {userTier === "team" && (
            <>
              <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>API access</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>White-label options</span>
              </div>
            </>
          )}
        </div>

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your subscription will cancel on{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
                <Button
                  variant="link"
                  onClick={onReactivate}
                  disabled={loadingReactivate}
                  className="mt-2 p-0 h-auto text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  {loadingReactivate ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    "Reactivate subscription"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          {userTier !== "team" && (
            <Button
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              onClick={() => router.push("/pricing")}
            >
              <Crown className="mr-2 h-4 w-4" />
              {userTier === "starter" ? "Upgrade to Pro" : "Upgrade to Team"}
            </Button>
          )}

          {!subscription.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancelClick}
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
