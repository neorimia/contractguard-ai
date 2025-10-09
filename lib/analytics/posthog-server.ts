/**
 * PostHog Server-Side Analytics
 *
 * Server-side analytics tracking for backend events (referrals, webhooks, etc.)
 */

import { PostHog } from "posthog-node";

// Initialize PostHog for server-side tracking
let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    console.warn("PostHog API key not configured. Server-side analytics disabled.");
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    });
  }

  return posthogClient;
}

/**
 * Track server-side event
 */
export function trackServerEvent(
  distinctId: string,
  eventName: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient();

  if (!client) {
    return;
  }

  try {
    client.capture({
      distinctId,
      event: eventName,
      properties,
    });
  } catch (error) {
    console.error("Failed to track server event:", error);
  }
}

/**
 * Identify user with properties
 */
export function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient();

  if (!client) {
    return;
  }

  try {
    client.identify({
      distinctId,
      properties,
    });
  } catch (error) {
    console.error("Failed to identify server user:", error);
  }
}

/**
 * Flush events (call before process termination)
 */
export async function flushServerEvents() {
  const client = getPostHogClient();

  if (!client) {
    return;
  }

  try {
    await client.shutdown();
  } catch (error) {
    console.error("Failed to flush server events:", error);
  }
}

// Referral-specific tracking helpers
export const ReferralAnalytics = {
  trackLanding: (referralCode: string, metadata?: Record<string, any>) => {
    trackServerEvent(`referral:${referralCode}`, "referral_landing", {
      referralCode,
      ...metadata,
    });
  },

  trackSignup: (
    referralCode: string,
    userId: number,
    metadata?: Record<string, any>
  ) => {
    trackServerEvent(`user:${userId}`, "referral_signup", {
      referralCode,
      userId,
      ...metadata,
    });
  },

  trackConfirmed: (
    referralCode: string,
    referrerId: number,
    referredId: number,
    rewardAmount: number,
    metadata?: Record<string, any>
  ) => {
    // Track for referrer
    trackServerEvent(`user:${referrerId}`, "referral_confirmed", {
      referralCode,
      referrerId,
      referredId,
      rewardAmount,
      ...metadata,
    });

    // Track for referred user
    trackServerEvent(`user:${referredId}`, "referral_confirmed_as_referee", {
      referralCode,
      referrerId,
      referredId,
      ...metadata,
    });
  },

  trackPaidConversion: (
    referralCode: string,
    referrerId: number,
    referredId: number,
    tier: string,
    metadata?: Record<string, any>
  ) => {
    // Track for referrer
    trackServerEvent(`user:${referrerId}`, "referral_paid_conversion", {
      referralCode,
      referrerId,
      referredId,
      tier,
      ...metadata,
    });

    // Track conversion funnel completion
    trackServerEvent(`user:${referredId}`, "referral_conversion_complete", {
      referralCode,
      tier,
      ...metadata,
    });
  },

  trackRewardEarned: (
    userId: number,
    rewardType: string,
    rewardAmount: number,
    metadata?: Record<string, any>
  ) => {
    trackServerEvent(`user:${userId}`, "referral_reward_earned", {
      userId,
      rewardType,
      rewardAmount,
      ...metadata,
    });
  },
};
