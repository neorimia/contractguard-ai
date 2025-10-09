// lib/referrals/antifraud.ts

export interface FraudCheckResult {
  isValid: boolean;
  reason?: string;
  riskScore: number; // 0-100
  flags: string[];
}

export const antifraudRules = {
  // IP-based checks
  sameIpThreshold: 3, // Max 3 signups from same IP per day

  // Email validation
  disposableEmailDomains: [
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "throwaway.email",
    "mailinator.com",
    "maildrop.cc",
    "yopmail.com",
    "temp-mail.org",
    "getnada.com",
    "trashmail.com",
  ],

  // Device fingerprint
  sameFingerprintThreshold: 2, // Max 2 signups per fingerprint

  // Time-based anomalies
  minTimeBetweenLandingAndSignup: 10, // seconds - too fast = bot
  maxTimeBetweenLandingAndSignup: 7 * 24 * 60 * 60, // 7 days - cookie expiry

  // Behavioral patterns
  requiredActionsForConfirmation: 1, // Min actions before confirming referral

  // Risk score thresholds
  riskScoreThresholds: {
    low: 25,
    medium: 50,
    high: 75,
  },
} as const;

/**
 * Calculate risk score based on multiple factors
 */
export function calculateRiskScore(factors: {
  sameIpCount?: number;
  sameFingerprintCount?: number;
  isDisposableEmail?: boolean;
  timeBetweenLandingAndSignup?: number;
  hasRequiredActions?: boolean;
}): number {
  let score = 0;

  // IP-based risk (0-30 points)
  if (factors.sameIpCount) {
    if (factors.sameIpCount >= antifraudRules.sameIpThreshold) {
      score += 30;
    } else {
      score += (factors.sameIpCount / antifraudRules.sameIpThreshold) * 30;
    }
  }

  // Fingerprint-based risk (0-25 points)
  if (factors.sameFingerprintCount) {
    if (factors.sameFingerprintCount >= antifraudRules.sameFingerprintThreshold) {
      score += 25;
    } else {
      score += (factors.sameFingerprintCount / antifraudRules.sameFingerprintThreshold) * 25;
    }
  }

  // Disposable email (0-20 points)
  if (factors.isDisposableEmail) {
    score += 20;
  }

  // Timing anomaly (0-15 points)
  if (factors.timeBetweenLandingAndSignup !== undefined) {
    if (factors.timeBetweenLandingAndSignup < antifraudRules.minTimeBetweenLandingAndSignup) {
      score += 15; // Too fast = likely bot
    } else if (factors.timeBetweenLandingAndSignup > antifraudRules.maxTimeBetweenLandingAndSignup) {
      score += 5; // Too slow = suspicious
    }
  }

  // Missing required actions (0-10 points)
  if (factors.hasRequiredActions === false) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Check if email domain is disposable
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return antifraudRules.disposableEmailDomains.includes(domain);
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= antifraudRules.riskScoreThresholds.high) return "critical";
  if (score >= antifraudRules.riskScoreThresholds.medium) return "high";
  if (score >= antifraudRules.riskScoreThresholds.low) return "medium";
  return "low";
}
