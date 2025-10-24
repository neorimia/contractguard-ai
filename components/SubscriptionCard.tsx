/**
 * SubscriptionCard Component
 *
 * Displays the user's current subscription tier with relevant information and actions.
 * Uses data-driven approach with TIER_METADATA configuration for maintainability.
 *
 * Features:
 * - Displays tier badge, title, and feature description
 * - Shows appropriate action button (Upgrade for free, Manage for paid tiers)
 * - Pulls scan limits from PRICING_CONFIG to ensure consistency
 * - Includes loading skeleton state
 * - Fully accessible with ARIA labels
 *
 * @example
 * ```tsx
 * <SubscriptionCard
 *   userTier="starter"
 *   loadingPortal={false}
 *   onManageSubscription={() => handleManage()}
 *   onUpgrade={() => router.push('/pricing')}
 * />
 * ```
 */
"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Crown, Zap, Loader2, LucideIcon } from "lucide-react";
import { PRICING_CONFIG } from "@/lib/config/pricing";

// Types
type UserTier = "free" | "starter" | "pro" | "team" | "enterprise";

interface SubscriptionCardProps {
  userTier: UserTier;
  loadingPortal: boolean;
  onManageSubscription: () => void;
  onUpgrade: () => void;
  isLoading?: boolean;
}

interface TierMetadata {
  badge: {
    icon: LucideIcon;
    label: string;
    colorClasses: string;
  };
  title: string;
  description: string;
}

// Tier Display Configuration
const TIER_METADATA: Record<UserTier, TierMetadata> = {
  free: {
    badge: {
      icon: Zap,
      label: "Free",
      colorClasses:
        "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
    },
    title: "Free Tier",
    description: "3 scans per day • Basic features",
  },
  starter: {
    badge: {
      icon: Zap,
      label: "Starter",
      colorClasses:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    },
    title: "Starter Plan",
    description: `${PRICING_CONFIG.starter.monthlyCredits} scans per month • AI audits & alerts`,
  },
  pro: {
    badge: {
      icon: Zap,
      label: "Pro",
      colorClasses:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    },
    title: "Pro Plan",
    description: `${PRICING_CONFIG.pro.monthlyCredits} scans per month • Advanced features`,
  },
  team: {
    badge: {
      icon: Crown,
      label: "Team",
      colorClasses:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    },
    title: "Team Plan",
    description: `${PRICING_CONFIG.team.monthlyCredits} scans per month • Team & API access`,
  },
  enterprise: {
    badge: {
      icon: Crown,
      label: "Enterprise",
      colorClasses:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    },
    title: "Team Plan",
    description: `${PRICING_CONFIG.team.monthlyCredits} scans per month • Team & API access`,
  },
} as const;

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

  // Get tier metadata
  const tierMeta = TIER_METADATA[userTier];
  const BadgeIcon = tierMeta.badge.icon;
  const isPaidTier = userTier !== "free";

  return (
    <div
      className="mb-6 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]"
      role="region"
      aria-label="Subscription information"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className="text-lg font-semibold text-black dark:text-white"
                id="subscription-title"
              >
                Current Plan
              </h3>
              {isPaidTier && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${tierMeta.badge.colorClasses}`}
                  aria-label={`${tierMeta.badge.label} tier badge`}
                >
                  <span className="flex items-center gap-1">
                    <BadgeIcon className="h-3 w-3" aria-hidden="true" />
                    {tierMeta.badge.label}
                  </span>
                </span>
              )}
            </div>
            <p
              className="text-2xl font-bold text-black dark:text-white mb-1"
              aria-describedby="subscription-title"
            >
              {tierMeta.title}
            </p>
            <p
              className="text-sm text-black/60 dark:text-white/60"
              aria-label="Plan features"
            >
              {tierMeta.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0">
            {isPaidTier ? (
              <Button
                onClick={onManageSubscription}
                disabled={loadingPortal}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                aria-label="Manage your subscription"
              >
                {loadingPortal ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                    Manage Subscription
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onUpgrade}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                aria-label="Upgrade to a paid plan"
              >
                <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for SubscriptionCard
 * Displays animated placeholders while tier data is being fetched
 */
function SubscriptionCardSkeleton() {
  return (
    <div
      className="mb-6 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]"
      role="status"
      aria-label="Loading subscription information"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header skeleton */}
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse"
                aria-hidden="true"
              />
              <div
                className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full animate-pulse"
                aria-hidden="true"
              />
            </div>

            {/* Title skeleton */}
            <div
              className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse"
              aria-hidden="true"
            />

            {/* Description skeleton */}
            <div
              className="h-4 w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse"
              aria-hidden="true"
            />
          </div>

          {/* Button skeleton */}
          <div
            className="h-10 w-40 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>
      <span className="sr-only">Loading subscription information...</span>
    </div>
  );
}
