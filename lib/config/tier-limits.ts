// lib/config/tier-limits.ts

export const TIER_LIMITS = {
    free: {
        scansPerDay: 3,
        apiAccess: false,
        support: 'community',
        features: ['basic-scan', 'risk-score', 'issue-detection']
    },
    pro: {
        scansPerDay: 100,
        apiAccess: true,
        support: 'email',
        features: ['basic-scan', 'risk-score', 'issue-detection', 'detailed-analysis', 'export-reports']
    },
    enterprise: {
        scansPerDay: -1, // unlimited
        apiAccess: true,
        support: 'priority',
        features: ['all', 'custom-rules', 'white-label', 'dedicated-support']
    }
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getTierLimit(tier: string): number {
    const normalizedTier = tier.toLowerCase() as TierName;
    const limit = TIER_LIMITS[normalizedTier];
    return limit?.scansPerDay ?? TIER_LIMITS.free.scansPerDay;
}

export function hasFeature(tier: string, feature: string): boolean {
    const normalizedTier = tier.toLowerCase() as TierName;
    const tierConfig = TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;

    if (tierConfig.features.includes('all')) {
        return true;
    }

    return tierConfig.features.includes(feature);
}

export function hasApiAccess(tier: string): boolean {
    const normalizedTier = tier.toLowerCase() as TierName;
    const tierConfig = TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;
    return tierConfig.apiAccess;
}
