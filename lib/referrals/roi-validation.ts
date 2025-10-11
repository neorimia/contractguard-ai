// lib/referrals/roi-validation.ts

import { REFERRAL_TIERS } from "./gamification-config";

/**
 * ROI thresholds for each referral tier
 * Based on revenue requirements and reward costs
 */
export const ROI_THRESHOLDS = {
  bronze: {
    minRevenue: 150, // $1.50 in cents (15 users × $0.10 avg)
    maxRewardCost: 6, // $0.06 (7 days of Pro trial value)
  },
  iron: {
    minRevenue: 400, // $4.00 in cents (25 users × $0.16 avg)
    maxRewardCost: 10, // $0.10 (14 days of Pro trial value)
  },
  silver: {
    minRevenue: 1000, // $10.00 in cents (50 users × $0.20 avg)
    maxRewardCost: 29, // $0.29 (1 month Pro value)
  },
  gold: {
    minRevenue: 2500, // $25.00 in cents (100 users × $0.25 avg)
    maxRewardCost: 58, // $0.58 (2 months Pro value)
  },
  platinum: {
    minRevenue: 4000, // $40.00 in cents (150 users × $0.27 avg)
    maxRewardCost: 87, // $0.87 (3 months Pro value)
  },
  ambassador: {
    minRevenue: 10000, // $100.00 in cents (250 users × $0.40 avg)
    maxRewardCost: 249, // $2.49 (Lifetime Pro equivalent)
  },
} as const;

/**
 * Check if reward is profitable based on ROI calculation
 * Only approve if ROI ≥ 5× (5:1 return on investment)
 */
export function isRewardProfitable(
  tier: keyof typeof ROI_THRESHOLDS,
  revenue: number
): boolean {
  const threshold = ROI_THRESHOLDS[tier];
  if (!threshold) {
    console.warn(`[ROI] Unknown tier: ${tier}`);
    return false;
  }

  const { minRevenue, maxRewardCost } = threshold;

  // Calculate ROI ratio
  const roi = revenue / maxRewardCost;

  // Check both conditions:
  // 1. Revenue meets minimum threshold
  // 2. ROI is at least 5× (500%)
  const meetsMinRevenue = revenue >= minRevenue;
  const meetsROITarget = roi >= 5;

  if (!meetsMinRevenue || !meetsROITarget) {
    console.log(
      `[ROI] Tier ${tier} - Revenue: $${(revenue / 100).toFixed(2)} / $${(minRevenue / 100).toFixed(2)} | ROI: ${roi.toFixed(2)}× / 5× (${meetsMinRevenue ? "✓" : "✗"} revenue, ${meetsROITarget ? "✓" : "✗"} ROI)`
    );
  }

  return meetsMinRevenue && meetsROITarget;
}

/**
 * Check if tier unlock is valid (both referral count and paid count met)
 */
export function isTierUnlocked(
  referrals: number,
  paidReferrals: number,
  tier: keyof typeof REFERRAL_TIERS
): boolean {
  const config = REFERRAL_TIERS[tier];
  if (!config) {
    console.warn(`[Tier] Unknown tier: ${tier}`);
    return false;
  }

  const meetsReferrals = referrals >= config.referralsRequired;
  const meetsPaid = paidReferrals >= config.paidReferralsRequired;

  return meetsReferrals && meetsPaid;
}

/**
 * Calculate referred user revenue for ROI check
 * This should be called with actual subscription revenue data
 */
export function calculateReferredRevenue(paidReferrals: number): number {
  // Assuming average $29/month Pro subscription
  // This is a simplified calculation - in production, sum actual subscription amounts
  const avgSubscriptionValue = 2900; // $29.00 in cents
  return paidReferrals * avgSubscriptionValue;
}

/**
 * Calculate the value of a tier reward in cents
 */
export function calculateRewardValue(tier: keyof typeof ROI_THRESHOLDS): number {
  const threshold = ROI_THRESHOLDS[tier];
  return threshold.maxRewardCost;
}

/**
 * Get ROI status for a user's tier progression
 */
export function getROIStatus(
  tier: keyof typeof ROI_THRESHOLDS,
  revenue: number
): {
  isProfitable: boolean;
  currentROI: number;
  targetROI: number;
  revenueGap: number;
  message: string;
} {
  const threshold = ROI_THRESHOLDS[tier];
  const { minRevenue, maxRewardCost } = threshold;

  const currentROI = revenue / maxRewardCost;
  const targetROI = 5;
  const revenueGap = Math.max(0, minRevenue - revenue);

  const isProfitable = isRewardProfitable(tier, revenue);

  let message = "";
  if (isProfitable) {
    message = `Reward approved: ROI of ${currentROI.toFixed(1)}× exceeds 5× target`;
  } else if (revenue < minRevenue) {
    message = `Need $${(revenueGap / 100).toFixed(2)} more revenue to unlock reward`;
  } else {
    message = `ROI of ${currentROI.toFixed(1)}× is below 5× target`;
  }

  return {
    isProfitable,
    currentROI,
    targetROI,
    revenueGap,
    message,
  };
}