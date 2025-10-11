// lib/referrals/gamification-config.ts

export interface ReferralTier {
  id: "none" | "bronze" | "iron" | "silver" | "gold" | "platinum" | "ambassador";
  name: string;
  referralsRequired: number;
  paidReferralsRequired: number; // NEW: Required paid referrals
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
    paidReferralsRequired: 0,
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
    referralsRequired: 15,
    paidReferralsRequired: 0,
    badge: "🥉",
    color: "#CD7F32",
    bgGradient: "from-orange-600 to-orange-700",
    reward: {
      type: "trial",
      description: "7 Day Pro Trial",
      details: "Invite 15 paying users to unlock a 7-day Pro trial",
    },
    perks: ["7 day Pro trial", "Priority support", "Bronze badge"],
  },
  iron: {
    id: "iron",
    name: "Iron",
    referralsRequired: 25,
    paidReferralsRequired: 3,
    badge: "⚙️",
    color: "#A19D94",
    bgGradient: "from-gray-600 to-gray-700",
    reward: {
      type: "trial",
      description: "14 Day Pro Trial",
      details: "Invite 25 users (3 paying) to earn a 14-day Pro trial",
    },
    perks: [
      "14 day Pro trial",
      "Featured on leaderboard",
      "Iron badge",
      "Priority support",
    ],
  },
  silver: {
    id: "silver",
    name: "Silver",
    referralsRequired: 50,
    paidReferralsRequired: 5,
    badge: "🥈",
    color: "#C0C0C0",
    bgGradient: "from-gray-400 to-gray-500",
    reward: {
      type: "subscription",
      description: "1 Month Pro + 5% Commission",
      details: "Reach 50 referrals (5 paying) for 1 month Pro + 5% commission",
    },
    perks: [
      "1 month Pro free",
      "5% recurring commission",
      "Featured on leaderboard",
      "Silver badge",
      "Early features access",
    ],
    commissionRate: 0.05,
  },
  gold: {
    id: "gold",
    name: "Gold",
    referralsRequired: 100,
    paidReferralsRequired: 7,
    badge: "🥇",
    color: "#FFD700",
    bgGradient: "from-yellow-500 to-yellow-600",
    reward: {
      type: "subscription",
      description: "2 Months Pro + 10% Commission",
      details: "Invite 100 users (7 paying) for 2 months Pro + 10% commission",
    },
    perks: [
      "2 months Pro free",
      "10% recurring commission",
      "Top leaderboard spot",
      "Gold badge",
      "Personal success manager",
    ],
    commissionRate: 0.1,
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    referralsRequired: 150,
    paidReferralsRequired: 15,
    badge: "💎",
    color: "#E5E4E2",
    bgGradient: "from-blue-400 to-blue-500",
    reward: {
      type: "lifetime",
      description: "3 Months Pro + 10% Commission",
      details: "Bring 150 users (15 paying) for 3 months Pro + 10% recurring commission",
    },
    perks: [
      "3 months Pro free",
      "10% recurring commission",
      "Exclusive Discord",
      "Platinum badge",
      "Quarterly swag",
    ],
    commissionRate: 0.1,
  },
  ambassador: {
    id: "ambassador",
    name: "Ambassador",
    referralsRequired: 250,
    paidReferralsRequired: 30,
    badge: "👑",
    color: "#9333EA",
    bgGradient: "from-purple-600 to-purple-700",
    reward: {
      type: "commission",
      description: "Lifetime Pro + 20% Commission",
      details: "250 referrals (30 paying) unlock Lifetime Pro + 20% recurring commission",
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
  "iron",
  "silver",
  "gold",
  "platinum",
  "ambassador",
];

// Get tier based on referral count AND paid referral count
export function getTierFromCount(
  referralCount: number,
  paidReferralCount: number = 0
): ReferralTier {
  const tiers = Object.values(REFERRAL_TIERS).sort(
    (a, b) => b.referralsRequired - a.referralsRequired
  );

  for (const tier of tiers) {
    if (
      referralCount >= tier.referralsRequired &&
      paidReferralCount >= tier.paidReferralsRequired
    ) {
      return tier;
    }
  }

  return REFERRAL_TIERS.none;
}

// Get next tier and progress
export function getNextTier(
  currentCount: number,
  paidCount: number = 0
): {
  currentTier: ReferralTier;
  nextTier: ReferralTier | null;
  progress: number;
  referralsNeeded: number;
  paidReferralsNeeded: number;
} {
  const currentTier = getTierFromCount(currentCount, paidCount);
  const currentIndex = TIER_ORDER.indexOf(currentTier.id);

  if (currentIndex >= TIER_ORDER.length - 1) {
    // Already at max tier
    return {
      currentTier,
      nextTier: null,
      progress: 100,
      referralsNeeded: 0,
      paidReferralsNeeded: 0,
    };
  }

  const nextTierId = TIER_ORDER[currentIndex + 1];
  const nextTier = REFERRAL_TIERS[nextTierId];

  const referralsNeeded = Math.max(
    0,
    nextTier.referralsRequired - currentCount
  );
  const paidReferralsNeeded = Math.max(
    0,
    nextTier.paidReferralsRequired - paidCount
  );

  // Calculate progress based on both metrics
  const referralProgress =
    (currentCount / nextTier.referralsRequired) * 100 * 0.6; // 60% weight
  const paidProgress =
    nextTier.paidReferralsRequired > 0
      ? (paidCount / nextTier.paidReferralsRequired) * 100 * 0.4
      : 40; // 40% weight
  const progress = referralProgress + paidProgress;

  return {
    currentTier,
    nextTier,
    progress: Math.min(progress, 100),
    referralsNeeded,
    paidReferralsNeeded,
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
