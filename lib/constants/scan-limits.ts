/**
 * Scan Limits and Configuration Constants
 *
 * Centralized configuration for all scan-related limits, thresholds, and timing values.
 * These constants ensure consistency across the application and make it easy to adjust
 * business logic in one place.
 */

/**
 * Scan limit configurations by user type
 */
export const SCAN_LIMITS = {
  /**
   * Anonymous (non-logged-in) users
   * - 3 total scans per 24-hour session
   * - Soft prompt after 1st scan to encourage signup
   * - Hard limit before 3rd scan (blocks after 2 scans)
   */
  ANONYMOUS: {
    MAX_SCANS: 3,
    SOFT_PROMPT_THRESHOLD: 1, // Show signup prompt after 1st scan
    HARD_LIMIT_THRESHOLD: 2, // Block after 2nd scan (before 3rd)
  },

  /**
   * Free tier (registered users)
   * - 3 scans per day (resets at midnight UTC)
   */
  FREE: {
    DAILY_SCANS: 3,
    RESET_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24 hours
  },

  /**
   * Pro tier (paid subscription)
   * - Unlimited scans
   */
  PRO: {
    DAILY_SCANS: -1, // -1 = unlimited
  },

  /**
   * Team tier (paid subscription)
   * - Unlimited scans
   */
  TEAM: {
    DAILY_SCANS: -1, // -1 = unlimited
  },
} as const;

/**
 * Cache TTL (Time To Live) configurations
 * Controls how long data is cached at different layers
 */
export const CACHE_TTL = {
  /**
   * Redis cache TTL (hot cache)
   * Short TTL for frequently accessed data
   */
  REDIS_SECONDS: 300, // 5 minutes

  /**
   * Database cache TTL (warm cache)
   * Longer TTL for audit results that change infrequently
   */
  DATABASE_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * UI timing and animation constants
 * Controls user experience timing and delays
 */
export const UI_TIMING = {
  /**
   * Delay before auto-scrolling to results
   * Allows time for results to render before scrolling
   */
  AUTO_SCROLL_DELAY_MS: 300,

  /**
   * Duration for toast notifications
   */
  TOAST_DURATION_MS: 3000, // 3 seconds

  /**
   * Modal animation duration
   */
  MODAL_ANIMATION_MS: 200,

  /**
   * Debounce delay for input validation
   */
  INPUT_DEBOUNCE_MS: 500,
} as const;

/**
 * AI Provider configuration by tier
 * Controls which AI providers are available for each subscription tier
 */
export const TIER_AI_PROVIDERS = {
  free: ["chatgpt"] as const,
  soft: ["chatgpt"] as const,
  pro: ["chatgpt", "claude"] as const,
  team: ["chatgpt", "claude"] as const,
  instant_credit: ["chatgpt", "claude"] as const,
} as const;

/**
 * AI Provider cost estimates (for internal tracking)
 * Used for cost optimization and analytics
 */
export const AI_PROVIDER_COSTS = {
  chatgpt: 0.002, // $0.002 per analysis
  claude: 0.015, // $0.015 per analysis
} as const;

/**
 * Address validation patterns
 */
export const ADDRESS_PATTERNS = {
  /**
   * EVM (Ethereum Virtual Machine) address format
   * 0x followed by 40 hexadecimal characters
   */
  EVM: /^0x[a-fA-F0-9]{40}$/,

  /**
   * Solana address format
   * Base58 encoded, 32-44 characters
   */
  SOLANA: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
} as const;

/**
 * Supported blockchain chains
 */
export const SUPPORTED_CHAINS = [
  { value: "ethereum", label: "Ethereum", icon: "⟠", type: "evm" },
  { value: "bsc", label: "BSC", icon: "💎", type: "evm" },
  { value: "polygon", label: "Polygon", icon: "⬡", type: "evm" },
  { value: "arbitrum", label: "Arbitrum", icon: "🔷", type: "evm" },
  { value: "optimism", label: "Optimism", icon: "🔴", type: "evm" },
  { value: "base", label: "Base", icon: "🔵", type: "evm" },
  { value: "avalanche", label: "Avalanche", icon: "🔺", type: "evm" },
  // { value: "solana", label: "Solana", icon: "◎", type: "solana" },
] as const;

/**
 * Type exports for TypeScript
 */
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number]["value"];
export type ChainType = (typeof SUPPORTED_CHAINS)[number]["type"];
export type AIProvider = "chatgpt" | "claude";
export type UserTier = keyof typeof TIER_AI_PROVIDERS;