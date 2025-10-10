// lib/referrals/config.ts

export const referralConfig = {
  // Code Generation
  codePrefix: "CG",
  codeLength: 6, // Results in CG-XXXXXX

  // Rewards for Referred User (signup bonus)
  signupBonusForReferred: {
    type: "scans" as const,
    amount: 3,
    description: "Welcome bonus for joining via referral",
  },

  // Rewards for Referrer (after confirmation)
  confirmBonusForReferrer: {
    type: "scans" as const,
    amount: 5,
    description: "Earned from successful referral",
  },

  // Rewards for Referrer (after Pro conversion)
  proBonusForReferrer: {
    type: "credit" as const,
    amount: 580, // 20% of $29 = $5.80 in cents
    description: "Affiliate commission for Pro referral",
  },

  // Alternative: Give 1 month Pro instead
  proMonthBonusForReferrer: {
    type: "pro_month" as const,
    amount: 1,
    description: "1 month Pro subscription",
  },

  // Anti-Fraud Limits
  dailyInviteCap: 10, // Max new referrals per day
  maxPendingReferrals: 50, // Max unconfirmed referrals

  // Cookie Settings
  cookieMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  cookieName: "cg_ref",

  // Confirmation Requirements
  confirmationTriggers: [
    "first_audit_complete", // User completed their first scan
    "email_verified", // User verified their email
  ] as const,

  // Expiration
  rewardExpirationDays: 365, // Bonus scans expire after 1 year
} as const;

export type ReferralConfigType = typeof referralConfig;
