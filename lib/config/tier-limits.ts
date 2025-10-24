// lib/config/tier-limits.ts

export const TIER_LIMITS = {
  free: {
    scansPerDay: 3,
    apiAccess: false,
    support: "community",
    features: ["basic-scan", "risk-score", "issue-detection"],
  },
  starter: {
    scansPerMonth: 30,
    apiAccess: false,
    support: "email",
    features: [
      "basic-scan",
      "risk-score",
      "issue-detection",
      "detailed-analysis",
      "export-reports",
      "email-summaries",
    ],
  },
  pro: {
    scansPerMonth: 150,
    apiAccess: true,
    support: "email",
    features: [
      "basic-scan",
      "risk-score",
      "issue-detection",
      "detailed-analysis",
      "export-reports",
      "advanced-analysis",
      "ai-chat",
      "priority-support",
    ],
  },
  team: {
    scansPerMonth: 1000,
    apiAccess: true,
    support: "priority",
    features: [
      "all",
      "multi-user",
      "shared-reports",
      "api-access",
      "white-label",
      "dedicated-support",
    ],
  },
  enterprise: {
    scansPerMonth: -1, // unlimited
    apiAccess: true,
    support: "priority",
    features: ["all", "custom-rules", "white-label", "dedicated-support"],
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getTierLimit(tier: string): number {
  const normalizedTier = tier.toLowerCase() as TierName;
  const limit = TIER_LIMITS[normalizedTier];

  // Handle both daily and monthly limits for backward compatibility
  if ("scansPerDay" in limit) {
    return limit.scansPerDay ?? TIER_LIMITS.free.scansPerDay;
  }
  if ("scansPerMonth" in limit) {
    return limit.scansPerMonth ?? TIER_LIMITS.free.scansPerDay;
  }

  return TIER_LIMITS.free.scansPerDay;
}

export function getMonthlyTierLimit(tier: string): number {
  const normalizedTier = tier.toLowerCase() as TierName;
  const limit = TIER_LIMITS[normalizedTier];

  if ("scansPerMonth" in limit) {
    return limit.scansPerMonth;
  }

  // Convert daily to monthly for free tier (3 * 30 = 90)
  if ("scansPerDay" in limit) {
    return limit.scansPerDay * 30;
  }

  return TIER_LIMITS.free.scansPerDay * 30;
}

export function hasFeature(tier: string, feature: string): boolean {
  const normalizedTier = tier.toLowerCase() as TierName;
  const tierConfig = TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;

  if ((tierConfig.features as readonly string[]).includes("all")) {
    return true;
  }

  return (tierConfig.features as readonly string[]).includes(feature);
}

export function hasApiAccess(tier: string): boolean {
  const normalizedTier = tier.toLowerCase() as TierName;
  const tierConfig = TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;
  return tierConfig.apiAccess;
}
