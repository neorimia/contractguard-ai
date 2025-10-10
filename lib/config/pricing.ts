/**
 * Pricing Configuration
 *
 * Centralized pricing structure for hybrid monetization model:
 * - Instant Reports (pay-per-scan, no signup)
 * - Pro Subscription (monthly recurring)
 * - Team/API Plan (monthly recurring with API access)
 */

export const PRICING_CONFIG = {
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
      },
      {
        credits: 3,
        price: 9.99,
        stripePriceId: process.env.STRIPE_PRICE_INSTANT_3 || "",
        savings: "33% off",
        popular: true,
      },
      {
        credits: 5,
        price: 14.99,
        stripePriceId: process.env.STRIPE_PRICE_INSTANT_5 || "",
        savings: "40% off",
        popular: false,
      },
    ],
  },
  pro: {
    id: "pro_monthly",
    label: "Pro Plan",
    type: "subscription" as const,
    price: 29,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    interval: "month" as const,
    perks: [
      "Unlimited scans",
      "Advanced risk scoring",
      "Email alerts for watched contracts",
      "PDF export functionality",
      "AI chat for contract questions",
      "Priority support",
    ],
  },
  team: {
    id: "team_monthly",
    label: "Team/API Plan",
    type: "subscription" as const,
    price: 99,
    stripePriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY || "",
    interval: "month" as const,
    perks: [
      "Everything in Pro",
      "Multi-user dashboard",
      "Shared report library",
      "API access (€0.15/scan)",
      "White-label options",
      "Dedicated account manager",
    ],
  },
} as const;

// Type helpers
export type PricingTier = keyof typeof PRICING_CONFIG;
export type InstantPackage = (typeof PRICING_CONFIG.instant.packages)[number];
export type SubscriptionPlan =
  | typeof PRICING_CONFIG.pro
  | typeof PRICING_CONFIG.team;

// Helper functions
export function getInstantPackageByIndex(
  index: number,
): InstantPackage | null {
  return PRICING_CONFIG.instant.packages[index] || null;
}

export function getInstantPackageByCredits(
  credits: number,
): InstantPackage | null {
  return (
    PRICING_CONFIG.instant.packages.find((pkg) => pkg.credits === credits) ||
    null
  );
}

export function getSubscriptionPlan(
  tier: "pro" | "team",
): SubscriptionPlan | null {
  return PRICING_CONFIG[tier] || null;
}

// Validation helpers
export function isValidInstantPackageIndex(index: number): boolean {
  return index >= 0 && index < PRICING_CONFIG.instant.packages.length;
}

export function isValidSubscriptionTier(tier: string): tier is "pro" | "team" {
  return tier === "pro" || tier === "team";
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
