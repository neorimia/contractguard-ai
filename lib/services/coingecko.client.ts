// lib/services/coingecko.client.ts
/**
 * CoinGecko API client using official @coingecko/coingecko-typescript SDK
 * Singleton pattern for application-wide reuse
 */

import Coingecko, {
  RateLimitError,
  APIError,
} from '@coingecko/coingecko-typescript';

// Initialize a single, reusable client for the entire application
// This should be imported and used application-wide
export const coingeckoClient = new Coingecko({
  proAPIKey: process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY,
  environment:
    process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY
      ? 'pro'
      : 'demo', // Use 'demo' if no API key, 'pro' if API key provided
  maxRetries: 3, // Rely on the SDK's built-in retry mechanism
});

// Re-export types namespace and error classes for convenience
export { Coingecko, RateLimitError, APIError };

