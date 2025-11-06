// lib/services/token-search.config.ts

/**
 * Token Search Service Configuration
 * Centralized configuration for all magic numbers and settings
 */

export const TOKEN_SEARCH_CONFIG = {
  // Cache TTL settings (in seconds)
  CACHE: {
    REDIS_TTL: 300, // 5 minutes
    DATABASE_TTL: 86400, // 24 hours
  },

  // Query settings
  QUERY: {
    MIN_LENGTH: 2,
    MAX_RESULTS: 10,
    DEBOUNCE_MS: 300,
  },

  // API settings
  API: {
    COINGECKO_TIMEOUT: 10000, // 10 seconds
    DEXSCREENER_TIMEOUT: 8000, // 8 seconds
    MAX_CONCURRENT_FETCHES: 5, // Parallel fetch limit
  },

  // Supported chains
  CHAINS: {
    VALID: [
      'ethereum',
      'bsc',
      'polygon',
      'base',
      'arbitrum',
      'optimism',
      'avalanche',
    ] as const,
    PLATFORM_MAP: {
      ethereum: 'ethereum',
      'binance-smart-chain': 'bsc',
      'polygon-pos': 'polygon',
      base: 'base',
      arbitrum: 'arbitrum',
      'arbitrum-one': 'arbitrum',
      optimism: 'optimism',
      'optimistic-ethereum': 'optimism',
      avalanche: 'avalanche',
    } as const,
    // Reverse map: our chain name -> CoinGecko platform names
    CHAIN_TO_PLATFORMS: {
      ethereum: ['ethereum'],
      bsc: ['binance-smart-chain', 'bsc'],
      polygon: ['polygon-pos', 'polygon'],
      base: ['base'],
      arbitrum: ['arbitrum', 'arbitrum-one'],
      optimism: ['optimism', 'optimistic-ethereum'],
      avalanche: ['avalanche'],
    } as const,
    DEXSCREENER_MAP: {
      ethereum: 'ethereum',
      bsc: 'bsc',
      polygon: 'polygon',
      base: 'base',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
    } as const,
  },

  // Image security
  SECURITY: {
    ALLOWED_IMAGE_DOMAINS: [
      'assets.coingecko.com',
      'coin-images.coingecko.com',
      'dd.dexscreener.com',
      's2.coinmarketcap.com',
    ],
  },

  // Ranking weights
  RANKING: {
    EXACT_SYMBOL_MATCH: 40,
    EXACT_NAME_MATCH: 30,
    PREFIX_SYMBOL_MATCH: 20,
    PREFIX_NAME_MATCH: 15,
    MARKET_CAP_OVER_1B: 20,
    MARKET_CAP_OVER_100M: 15,
    MARKET_CAP_OVER_10M: 10,
    MARKET_CAP_OVER_1M: 5,
    LIQUIDITY_OVER_1M: 10,
    LIQUIDITY_OVER_100K: 5,
    VERIFIED_BONUS: 10,
  },
} as const;

// Type exports for type safety
export type ValidChain = (typeof TOKEN_SEARCH_CONFIG.CHAINS.VALID)[number];