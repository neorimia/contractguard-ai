// lib/referrals/gamification-config.ts

export interface ReferralTier {
  id: "none" | "bronze" | "silver" | "gold" | "platinum" | "ambassador";
  name: string;
  referralsRequired: number;
  badge: string;
  color: string;
  bgGradient: string;
  reward: {
    type: "trial" | "subscription" | "commission" | "lifetime";
    description: string;
    details: string;
  };
  perks: string[];
  commissionRate?: number; // For ambassador tier
}

export const REFERRAL_TIERS: Record<string, ReferralTier> = {
  none: {
    id: "none",
    name: "Starter",
    referralsRequired: 0,
    badge: "🌱",
    color: "#9CA3AF",
    bgGradient: "from-gray-500 to-gray-600",
    reward: {
      type: "trial",
      description: "Start your referral journey",
      details: "Share your code and earn rewards",
    },
    perks: ["Referral code", "Basic rewards", "Stats dashboard"],
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    referralsRequired: 3,
    badge: "🥉",
    color: "#CD7F32",
    bgGradient: "from-orange-600 to-orange-700",
    reward: {
      type: "trial",
      description: "1 Week Pro Trial",
      details: "Get 1 week of Pro access free",
    },
    perks: ["1 week Pro trial", "Priority support", "Bronze badge"],
  },
  silver: {
    id: "silver",
    name: "Silver",
    referralsRequired: 10,
    badge: "🥈",
    color: "#C0C0C0",
    bgGradient: "from-gray-400 to-gray-500",
    reward: {
      type: "subscription",
      description: "1 Month Pro Free",
      details: "Full month of Pro subscription",
    },
    perks: [
      "1 month Pro free",
      "Featured on leaderboard",
      "Silver badge",
      "Early features access",
    ],
  },
  gold: {
    id: "gold",
    name: "Gold",
    referralsRequired: 25,
    badge: "🥇",
    color: "#FFD700",
    bgGradient: "from-yellow-500 to-yellow-600",
    reward: {
      type: "subscription",
      description: "3 Months Pro Free",
      details: "Quarter of free Pro access",
    },
    perks: [
      "3 months Pro free",
      "Top leaderboard spot",
      "Gold badge",
      "Personal success manager",
    ],
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    referralsRequired: 50,
    badge: "💎",
    color: "#E5E4E2",
    bgGradient: "from-blue-400 to-blue-500",
    reward: {
      type: "lifetime",
      description: "Lifetime Pro Access",
      details: "Pro subscription forever",
    },
    perks: [
      "Lifetime Pro free",
      "Exclusive Discord",
      "Platinum badge",
      "Quarterly swag",
    ],
  },
  ambassador: {
    id: "ambassador",
    name: "Ambassador",
    referralsRequired: 100,
    badge: "👑",
    color: "#9333EA",
    bgGradient: "from-purple-600 to-purple-700",
    reward: {
      type: "commission",
      description: "Lifetime Pro + 20% Commission",
      details: "Earn 20% recurring commission on all referrals",
    },
    perks: [
      "Lifetime Pro free",
      "20% recurring commission",
      "Ambassador badge",
      "Revenue sharing",
      "Featured partner page",
      "Priority API access",
    ],
    commissionRate: 0.2,
  },
};

// Tier progression order
export const TIER_ORDER: Array<ReferralTier["id"]> = [
  "none",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "ambassador",
];

// Get tier based on referral count
export function getTierFromCount(referralCount: number): ReferralTier {
  const tiers = Object.values(REFERRAL_TIERS).sort(
    (a, b) => b.referralsRequired - a.referralsRequired
  );

  for (const tier of tiers) {
    if (referralCount >= tier.referralsRequired) {
      return tier;
    }
  }

  return REFERRAL_TIERS.none;
}

// Get next tier and progress
export function getNextTier(currentCount: number): {
  currentTier: ReferralTier;
  nextTier: ReferralTier | null;
  progress: number;
  referralsNeeded: number;
} {
  const currentTier = getTierFromCount(currentCount);
  const currentIndex = TIER_ORDER.indexOf(currentTier.id);

  if (currentIndex >= TIER_ORDER.length - 1) {
    // Already at max tier
    return {
      currentTier,
      nextTier: null,
      progress: 100,
      referralsNeeded: 0,
    };
  }

  const nextTierId = TIER_ORDER[currentIndex + 1];
  const nextTier = REFERRAL_TIERS[nextTierId];

  const referralsNeeded = nextTier.referralsRequired - currentCount;
  const progress = (currentCount / nextTier.referralsRequired) * 100;

  return {
    currentTier,
    nextTier,
    progress: Math.min(progress, 100),
    referralsNeeded,
  };
}

// Calculate commission amount (10% base, 20% for ambassador)
export function calculateCommission(
  subscriptionAmount: number, // in cents
  userTier: ReferralTier["id"]
): number {
  const tier = REFERRAL_TIERS[userTier];
  const rate = tier.commissionRate || 0.1; // Default 10%
  return Math.floor(subscriptionAmount * rate);
}

// Social proof milestones for viral marketing
export const SOCIAL_PROOF_MILESTONES = {
  users: [100, 500, 1000, 5000, 10000, 50000],
  savings: [10000, 50000, 100000, 500000, 1000000], // in USD cents
  scams: [50, 200, 500, 1000, 5000],
};

// Leaderboard configuration
export const LEADERBOARD_CONFIG = {
  topCount: 100, // Show top 100 referrers
  updateInterval: 3600, // Update every hour (in seconds)
  cacheTTL: 300, // Cache for 5 minutes
  anonymizeBelow: 10, // Show username only for users with 10+ referrals
};
