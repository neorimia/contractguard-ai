/**
 * PostHog Analytics Configuration
 *
 * Centralized analytics tracking for user behavior and conversions
 */

import posthog from "posthog-js";

// Initialize PostHog only on client side
export const initPostHog = () => {
  if (typeof window === "undefined") return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    console.warn("PostHog API key not configured. Analytics disabled.");
    return;
  }

  if (!posthog.__loaded) {
    posthog.init(apiKey, {
      api_host: apiHost,
      // Enable session recording (optional)
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: ".sensitive",
      },
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture page leaves
      capture_pageleave: true,
      // Persistence
      persistence: "localStorage",
      // Autocapture
      autocapture: {
        dom_event_allowlist: ["click", "submit"],
        url_allowlist: [/contractguard/],
      },
      // Load integrations
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized");
        }
      },
    });
  }
};

// Analytics event types
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  USER_VERIFIED_EMAIL: "user_verified_email",

  // Scan events
  SCAN_INITIATED: "scan_initiated",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",
  SCAN_LIMIT_REACHED: "scan_limit_reached",

  // Payment events
  CHECKOUT_INITIATED: "checkout_initiated",
  CHECKOUT_COMPLETED: "checkout_completed",
  CHECKOUT_CANCELED: "checkout_canceled",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  PORTAL_OPENED: "portal_opened",

  // Engagement events
  RESULT_SHARED: "result_shared",
  RESULT_VIEWED: "result_viewed",
  CTA_CLICKED: "cta_clicked",
  PRICING_PAGE_VIEWED: "pricing_page_viewed",
  ACCOUNT_PAGE_VIEWED: "account_page_viewed",

  // Feature usage
  FEATURE_USED: "feature_used",
  API_KEY_GENERATED: "api_key_generated",
  PDF_EXPORTED: "pdf_exported",

  // Referral events
  REFERRAL_LANDING: "referral_landing",
  REFERRAL_SIGNUP: "referral_signup",
  REFERRAL_CONFIRMED: "referral_confirmed",
  REFERRAL_PAID_CONVERSION: "referral_paid_conversion",
  REFERRAL_LINK_COPIED: "referral_link_copied",
  REFERRAL_LINK_SHARED: "referral_link_shared",
  REFERRAL_REWARD_EARNED: "referral_reward_earned",

  // Banner events
  BANNER_IMPRESSION: "banner_impression",
  BANNER_CLICK: "banner_click",
  BANNER_CONVERSION: "banner_conversion",
  BANNER_DISMISSED: "banner_dismissed",

  // Crypto analysis events
  CRYPTO_SCAN_STARTED: "crypto_scan_started",
  CRYPTO_SCAN_COMPLETED: "crypto_scan_completed",
  CRYPTO_SCAN_FAILED: "crypto_scan_failed",
  CRYPTO_RESULT_SHARED: "crypto_result_shared",
  CRYPTO_FLAG_EXPANDED: "crypto_flag_expanded",
  CRYPTO_CHAIN_SWITCHED: "crypto_chain_switched",
} as const;

// Track custom event
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  posthog.capture(eventName, properties);
};

// Track page view
export const trackPageView = (pageName: string) => {
  if (typeof window === "undefined") return;

  posthog.capture("$pageview", { page: pageName });
};

// Identify user
export const identifyUser = (
  userId: string,
  properties?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  posthog.identify(userId, properties);
};

// Track conversion
export const trackConversion = (
  conversionType: string,
  value?: number,
  properties?: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  posthog.capture("conversion", {
    type: conversionType,
    value,
    ...properties,
  });
};

// Reset user (on logout)
export const resetUser = () => {
  if (typeof window === "undefined") return;

  posthog.reset();
};

// Feature flags
export const isFeatureEnabled = (featureFlag: string): boolean => {
  if (typeof window === "undefined") return false;

  return posthog.isFeatureEnabled(featureFlag) || false;
};

// Get PostHog instance
export const getPostHog = () => {
  if (typeof window === "undefined") return null;

  return posthog;
};

export default posthog;
