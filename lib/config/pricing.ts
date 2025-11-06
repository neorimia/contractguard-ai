/**
 * Pricing Configuration
 *
 * Centralized pricing structure for hybrid monetization model:
 * - Instant Reports (pay-per-scan, no signup)
 * - Starter Subscription (monthly recurring)
 * - Pro Subscription (monthly recurring)
 * - Team/API Plan (monthly recurring with API access)
 *
 * Includes tier metadata for consistent display across the application.
 */

export const PRICING_CONFIG = {
  free: {
    id: "free",
    label: "Free",
    description: "Free tier",
    type: "one_time" as const,
    packages: [
      {
        credits: 1,
        price: 0,
        stripePriceId: process.env.STRIPE_PRICE_FREE || "",
        savings: null,
        popular: false,
        perks: [
          "1 scan per day",
          "Summary audit",
          "Shareable result card",
        ],
      },
    ],
  },
  instant: {
    id: "instant_report",
    label: "Instant Report",
    description: "Full AI audit report — no signup needed",
    type: "one_time" as const,
    packages: [
      {
        credits: 1,
        price: 4.99,
        stripePriceId: process.env.STRIPE_PRICE_INSTANT_1 || "",
        savings: null,
        popular: false,
        perks: [
          "Full AI security audit",
          "Detailed risk analysis",
          "Instant delivery",
          "Never expires",
        ],
      },
      {
        credits: 3,
        price: 9.99,
        stripePriceId: process.env.STRIPE_PRICE_INSTANT_3 || "",
        savings: "33% off",
        popular: true,
        perks: [
          "Full AI security audit",
          "Detailed risk analysis",
          "Instant delivery",
          "Never expires",
        ],
      },
      {
        credits: 5,
        price: 14.99,
        stripePriceId: process.env.STRIPE_PRICE_INSTANT_5 || "",
        savings: "40% off",
        popular: false,
        perks: [
          "Full AI security audit",
          "Detailed risk analysis",
          "Instant delivery",
          "Never expires",
        ],
      },
    ],
  },

  starter: {
    id: "starter_monthly",
    label: "Starter Plan",
    type: "subscription" as const,
    price: 14,
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
    interval: "month" as const,
    monthlyCredits: 30,
    extraScanPrice: 0.3,
    perks: [
      "30 full AI audits per month (≈1 per day)",
      "Plain-English explanations & risk scoring",
      "Email alerts for watched contracts",
      "PDF export functionality",
      // "Add-on scans at $0.30 each after 30/month",
    ],
  },

  pro: {
    id: "pro_monthly",
    label: "Pro Plan",
    type: "subscription" as const,
    price: 29,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
    interval: "month" as const,
    monthlyCredits: 150,
    extraScanPrice: 0.25,
    perks: [
      "150 AI audits per month (≈5/day)",
      "Advanced risk scoring & liquidity analysis",
      "Email alerts for watched contracts",
      "PDF export functionality",
      "Priority support",
      // "Extra scans just $0.25 each after 150/month",
    ],
  },

  team: {
    id: "team_monthly",
    label: "Team/API Plan",
    type: "subscription" as const,
    price: 99,
    stripePriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRICE_TEAM_YEARLY || "",
    interval: "month" as const,
    monthlyCredits: 1000,
    extraScanPrice: 0.1,
    perks: [
      "Everything in Pro",
      "Multi-user dashboard",
      "Shared report library",
      "API access",
      "White-label options",
      "Dedicated account manager",
    ],
  },
} as const;

// Unified credit limits export for backend usage
export const PRICING_LIMITS = {
  starter: {
    monthlyCredits: 30,
    extraScanPrice: 0.3,
  },
  pro: {
    monthlyCredits: 150,
    extraScanPrice: 0.25,
  },
  team: {
    monthlyCredits: 1000,
    extraScanPrice: 0.1,
  },
} as const;

// Type helpers
export type PricingTier = keyof typeof PRICING_CONFIG;
export type InstantPackage = (typeof PRICING_CONFIG.instant.packages)[number];
export type SubscriptionPlan = {
  id: string;
  label: string;
  type: "subscription";
  price: number;
  stripePriceId: string;
  stripePriceIdYearly: string;
  interval: "month";
  monthlyCredits: number;
  extraScanPrice: number;
  perks: readonly string[];
};

// Helper functions
export function getInstantPackageByIndex(index: number): InstantPackage | null {
  return PRICING_CONFIG.instant.packages[index] || null;
}

export function getInstantPackageByCredits(
  credits: number
): InstantPackage | null {
  return (
    PRICING_CONFIG.instant.packages.find((pkg) => pkg.credits === credits) ||
    null
  );
}

export function getSubscriptionPlan(
  tier: "starter" | "pro" | "team"
): SubscriptionPlan | null {
  return PRICING_CONFIG[tier] || null;
}

// Validation helpers
export function isValidInstantPackageIndex(index: number): boolean {
  return index >= 0 && index < PRICING_CONFIG.instant.packages.length;
}

export function isValidSubscriptionTier(
  tier: string
): tier is "starter" | "pro" | "team" {
  return tier === "starter" || tier === "pro" || tier === "team";
}

// Price calculation helpers
export function calculateInstantPrice(credits: number): number | null {
  const pkg = getInstantPackageByCredits(credits);
  return pkg ? pkg.price : null;
}

export function calculateSavings(packageIndex: number): number | null {
  const pkg = PRICING_CONFIG.instant.packages[packageIndex];
  if (!pkg || pkg.credits === 1) return null;

  const singlePrice = PRICING_CONFIG.instant.packages[0].price;
  const fullPrice = singlePrice * pkg.credits;
  return fullPrice - pkg.price;
}

/**
 * Tier Metadata Configuration
 *
 * Centralized tier display information for consistent UI across the application.
 * Used in account pages, subscription flows, and success messages.
 */
export const TIER_METADATA = {
  free: {
    name: "Free",
    displayName: "Free Tier",
    successMessage: "3 scans per day",
  },
  starter: {
    name: "Starter",
    displayName: "Starter Plan",
    successMessage: `Your ${PRICING_CONFIG.starter.monthlyCredits} monthly scans are now active.`,
  },
  pro: {
    name: "Pro",
    displayName: "Pro Plan",
    successMessage: `Your ${PRICING_CONFIG.pro.monthlyCredits} monthly scans are now active.`,
  },
  team: {
    name: "Team",
    displayName: "Team Plan",
    successMessage: `Your ${PRICING_CONFIG.team.monthlyCredits} monthly scans and API access are now active.`,
  },
  enterprise: {
    name: "Team",
    displayName: "Team Plan",
    successMessage: `Your ${PRICING_CONFIG.team.monthlyCredits} monthly scans and API access are now active.`,
  },
} as const;

/**
 * UI Configuration Constants
 *
 * Timing and behavior constants for consistent UX across the application.
 */
export const UI_CONFIG = {
  /** Redirect timeout after successful/canceled checkout (milliseconds) */
  REDIRECT_TIMEOUT_MS: 5000,
  /** Default loading timeout for async operations (milliseconds) */
  LOADING_TIMEOUT_MS: 30000,
} as const;
