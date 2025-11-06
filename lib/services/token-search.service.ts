// lib/services/token-search.service.ts
import { redis } from '@/lib/redis';
import { db } from '@/db';
import { tokenMetadata, type TokenMetadata } from '@/db/schema';
import { eq, or, like, desc, sql } from 'drizzle-orm';
import { TOKEN_SEARCH_CONFIG, type ValidChain } from './token-search.config';
import { createCircuitBreaker } from '@/lib/circuit-breaker';
import type CircuitBreaker from 'opossum';
import {
  createLogger,
  logCache,
  logExternalAPI,
  logPerformance,
} from '../logger';
import {
  coingeckoClient,
  Coingecko,
  RateLimitError,
  APIError,
} from './coingecko.client';

const logger = createLogger({ service: 'token-search' });

export interface TokenSearchResult {
  name: string;
  symbol: string;
  address: string;
  chain: string;
  logoUrl?: string;
  marketCap?: number;
  liquidity?: string;
  verified: boolean;
}

export interface TokenSearchResponse {
  tokens: TokenSearchResult[];
  source: 'coingecko' | 'moralis' | 'dexscreener' | 'cache' | 'database';
  cached: boolean;
}

// CoinGecko types are now imported from the SDK

export class TokenSearchService {
  private moralisApiKey?: string;

  // In-flight request deduplication map
  private static inflightRequests = new Map<
    string,
    Promise<TokenSearchResponse>
  >();

  // Circuit breakers for external APIs
  private static coinGeckoBreaker: CircuitBreaker<any[], any> | null = null;
  private static dexScreenerBreaker: CircuitBreaker<any[], any> | null = null;

  constructor() {
    this.moralisApiKey = process.env.MORALIS_API_KEY;

    // Initialize circuit breakers (singleton pattern)
    if (!TokenSearchService.coinGeckoBreaker) {
      TokenSearchService.coinGeckoBreaker = createCircuitBreaker(
        async (query: string, chain?: string) =>
          this.searchCoinGeckoInternal(query, chain),
        {
          timeout: TOKEN_SEARCH_CONFIG.API.COINGECKO_TIMEOUT,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
          name: 'CoinGecko',
        }
      );
    }

    if (!TokenSearchService.dexScreenerBreaker) {
      TokenSearchService.dexScreenerBreaker = createCircuitBreaker(
        async (query: string, chain?: string) =>
          this.searchDexScreenerInternal(query, chain),
        {
          timeout: TOKEN_SEARCH_CONFIG.API.DEXSCREENER_TIMEOUT,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
          name: 'DexScreener',
        }
      );
    }
  }

  /**
   * Search for tokens by name or symbol
   * Implements request deduplication for concurrent identical queries
   */
  async searchTokens(
    query: string,
    chain?: string
  ): Promise<TokenSearchResponse> {
    if (!query || query.length < TOKEN_SEARCH_CONFIG.QUERY.MIN_LENGTH) {
      return {
        tokens: [],
        source: 'cache',
        cached: true,
      };
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `token:search:${normalizedQuery}:${chain || 'all'}`;

    // Request deduplication: check if identical request is in-flight
    const existingRequest =
      TokenSearchService.inflightRequests.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request promise and store it
    const requestPromise = this.executeSearch(normalizedQuery, chain, cacheKey);

    // Store in-flight request
    TokenSearchService.inflightRequests.set(cacheKey, requestPromise);

    // Clean up after request completes (success or failure)
    requestPromise.finally(() => {
      TokenSearchService.inflightRequests.delete(cacheKey);
    });

    return requestPromise;
  }

  /**
   * Execute the actual search logic
   * Separated for request deduplication
   */
  private async executeSearch(
    normalizedQuery: string,
    chain: string | undefined,
    cacheKey: string
  ): Promise<TokenSearchResponse> {

    // Check Redis cache first (5-minute TTL)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logCache('hit', cacheKey, { source: 'redis' });
        return {
          tokens: JSON.parse(cached as string),
          source: 'cache',
          cached: true,
        };
      }
      logCache('miss', cacheKey, { source: 'redis' });
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          cacheKey,
          source: 'redis',
        },
        'Redis cache error'
      );
    }

    // Check database cache (24-hour TTL)
    try {
      const dbResults = await this.searchDatabase(normalizedQuery, chain);
      if (dbResults.length > 0) {
        const response: TokenSearchResponse = {
          tokens: dbResults,
          source: 'database',
          cached: true,
        };

        // Cache in Redis for faster subsequent lookups
        try {
          await redis.set(cacheKey, JSON.stringify(dbResults), {
            ex: TOKEN_SEARCH_CONFIG.CACHE.REDIS_TTL,
          });
          logCache('set', cacheKey, { source: 'redis', from: 'database' });
        } catch (error) {
          logger.warn(
            {
              error: error instanceof Error ? error : new Error(String(error)),
              cacheKey,
            },
            'Redis set error'
          );
        }

        return response;
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error : new Error(String(error)),
          query: normalizedQuery,
          chain,
        },
        'Database search error'
      );
    }

    // Fetch from external APIs
    let tokens: TokenSearchResult[] = [];
    let source: TokenSearchResponse['source'] = 'coingecko';

    try {
      // Try CoinGecko first (primary)
      tokens = await this.searchCoinGecko(normalizedQuery, chain);
      source = 'coingecko';
    } catch (error) {
      console.error('CoinGecko search error:', error);

      try {
        // Fallback to DexScreener
        tokens = await this.searchDexScreener(normalizedQuery, chain);
        source = 'dexscreener';
      } catch (dexError) {
        console.error('DexScreener search error:', dexError);

        // Final fallback to Moralis (if configured)
        if (this.moralisApiKey) {
          try {
            tokens = await this.searchMoralis(normalizedQuery, chain);
            source = 'moralis';
          } catch (moralisError) {
            console.error('Moralis search error:', moralisError);
          }
        }
      }
    }

    // Rank and limit results
    const rankedTokens = this.rankResults(tokens, normalizedQuery).slice(
      0,
      TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS
    );

    // Cache results in parallel for better performance
    const cachePromises = [
      // Redis cache (5 minutes)
      redis
        .set(cacheKey, JSON.stringify(rankedTokens), {
          ex: TOKEN_SEARCH_CONFIG.CACHE.REDIS_TTL,
        })
        .catch((error) => console.warn('Redis cache set error:', error)),

      // Database cache (24 hours) - only for fresh API results
      this.storeInDatabase(rankedTokens).catch((error) =>
        console.warn('Database storage error:', error)
      ),
    ];

    // Don't block response on cache writes
    Promise.allSettled(cachePromises);

    return {
      tokens: rankedTokens,
      source,
      cached: false,
    };
  }

  /**
   * Search database cache
   */
  private async searchDatabase(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    const searchPattern = `%${query}%`;

    const conditions = [
      like(tokenMetadata.symbol, searchPattern),
      like(tokenMetadata.name, searchPattern),
    ];

    // Add chain filter if provided
    if (chain) {
      conditions.push(eq(tokenMetadata.chain, chain));
    }

    const results = await db
      .select()
      .from(tokenMetadata)
      .where(or(...conditions))
      .orderBy(desc(tokenMetadata.marketCap))
      .limit(TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS);

    return results.map((row) => ({
      name: row.name,
      symbol: row.symbol,
      address: row.address,
      chain: row.chain,
      logoUrl: row.logoUrl || undefined,
      marketCap: row.marketCap ? Number(row.marketCap) : undefined,
      liquidity: row.liquidity || undefined,
      verified: row.verified || false,
    }));
  }

  /**
   * Search CoinGecko API with circuit breaker protection
   * PUBLIC WRAPPER: Uses circuit breaker to prevent cascading failures
   */
  private async searchCoinGecko(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    if (!TokenSearchService.coinGeckoBreaker) {
      throw new Error('CoinGecko circuit breaker not initialized');
    }
    return await TokenSearchService.coinGeckoBreaker.fire(query, chain);
  }

  /**
   * Search CoinGecko API with parallel detail fetches
   * INTERNAL METHOD: Contains actual SDK logic, called by circuit breaker
   * PERFORMANCE OPTIMIZATION: Parallelizes coin detail fetches (5s → <1s)
   * Uses official @coingecko/coingecko-typescript SDK with proper error handling
   */
  private async searchCoinGeckoInternal(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    try {
      // For chain-specific searches (e.g., Ethereum ecosystem), use Markets API to get
      // comprehensive token list filtered by platform, then filter by query
      // This matches CoinGecko's ecosystem pages like https://www.coingecko.com/en/categories/ethereum-ecosystem
      if (chain === 'ethereum') {
        return await this.searchEthereumEcosystem(query);
      }

      // For other chains or general searches, use the standard search approach
      // Search for coins using SDK
      const searchParams: Coingecko.Search.SearchGetParams = {
        query: query,
      };

      const searchData = await coingeckoClient.search.get(searchParams);

      // Type guard for the response
      if (!searchData || !searchData.coins || !Array.isArray(searchData.coins)) {
        return [];
      }

      // When chain is specified, fetch significantly more coins to ensure comprehensive results
      // Similar to CoinGecko's chain pages that show all tokens on that chain
      // DEMO MODE FIX: Limit fetches when no API key to avoid rate limits
      const hasApiKey = !!(process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY);
      const DEMO_MODE_LIMIT = 5; // Conservative limit for demo mode to avoid rate limits

      const INITIAL_FETCH_LIMIT = !hasApiKey
        ? DEMO_MODE_LIMIT
        : chain
        ? Math.max(TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS * 10, 100) // Fetch up to 100 when chain is specified
        : Math.max(TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS * 3, 30); // Otherwise fetch 30

      const coinsToFetch = searchData.coins.slice(0, INITIAL_FETCH_LIMIT);

      // Log demo mode warning
      if (!hasApiKey) {
        logger.warn(
          {
            query,
            chain,
            limitedTo: DEMO_MODE_LIMIT,
          },
          'Running in CoinGecko demo mode - results limited to avoid rate limits'
        );
      }

      // Create parallel detail fetch promises with proper error handling
      const detailPromises = coinsToFetch.map(async (coin) => {
        if (!coin.id) return null;

        try {
          const detail = await coingeckoClient.coins.getID(coin.id);
          return detail;
        } catch (err) {
          // Handle SDK-specific errors
          if (err instanceof RateLimitError) {
            logger.warn(
              {
                coinId: coin.id,
                query,
              },
              'CoinGecko rate limit error fetching coin details'
            );
          } else if (err instanceof APIError) {
            logger.warn(
              {
                coinId: coin.id,
                query,
                error: err.name,
                status: err.status,
              },
              'CoinGecko API error fetching coin details'
            );
          } else {
            logger.warn(
              {
                error: err instanceof Error ? err : new Error(String(err)),
                coinId: coin.id,
                query,
              },
              'Unexpected error fetching coin details'
            );
          }
          return null;
        }
      });

      // Execute all fetches in parallel
      const detailResults = await Promise.allSettled(detailPromises);

      // Process results and extract token data
      const tokens: TokenSearchResult[] = [];
      let successfulFetches = 0;
      let failedFetches = 0;
      const platformMap = TOKEN_SEARCH_CONFIG.CHAINS.PLATFORM_MAP;
      const chainToPlatforms = (TOKEN_SEARCH_CONFIG.CHAINS as any).CHAIN_TO_PLATFORMS;
      const seenTokens = new Set<string>(); // Track (address, chain) to avoid duplicates

      // Helper function to check if a platform matches the specified chain
      const platformMatchesChain = (platform: string): string | null => {
        const platformKey = platform as keyof typeof platformMap;
        const mappedChain = platformMap[platformKey];

        if (!mappedChain || typeof mappedChain !== 'string') return null;

        // If no chain filter, include all
        if (!chain) return mappedChain;

        // Check if this platform matches the requested chain
        const chainKey = chain as keyof typeof chainToPlatforms;
        const allowedPlatforms = chainToPlatforms[chainKey];
        if (!allowedPlatforms) return null;

        const normalizedPlatform = platform.toLowerCase();
        const platformArray = allowedPlatforms as readonly string[];
        if (platformArray.includes(normalizedPlatform)) {
          return mappedChain;
        }

        // Also check direct mapping
        if (mappedChain === chain) {
          return mappedChain;
        }

        return null;
      };

      for (const result of detailResults) {
        if (result.status === 'rejected' || !result.value) {
          failedFetches++;
          continue;
        }

        successfulFetches++;
        const detail = result.value;

        // Extract contract addresses from platforms (for tokens on multiple chains)
        if (detail.platforms && Object.keys(detail.platforms).length > 0) {
          for (const [platform, address] of Object.entries(detail.platforms)) {
            if (!address || typeof address !== 'string') continue;

            const mappedChain = platformMatchesChain(platform);
            if (!mappedChain) continue;

            const tokenKey = `${address.toLowerCase()}:${mappedChain}`;
            if (seenTokens.has(tokenKey)) continue;
            seenTokens.add(tokenKey);

            tokens.push({
              name: detail.name || '',
              symbol: (detail.symbol || '').toUpperCase(),
              address: address.toLowerCase(),
              chain: mappedChain,
              logoUrl: detail.image?.small,
              marketCap: detail.market_data?.market_cap?.usd,
              verified: true,
            });
          }
        } else if (detail.asset_platform_id) {
          // Handle native tokens (ETH, BNB, etc.) that don't have platform entries
          // but have an asset_platform_id indicating their native chain
          const assetPlatform = detail.asset_platform_id.toLowerCase();
          
          // Map asset_platform_id to our chain format
          let mappedChain: string | undefined;
          
          if (assetPlatform === 'ethereum') {
            mappedChain = 'ethereum';
          } else if (assetPlatform === 'binance-smart-chain' || assetPlatform === 'bsc') {
            mappedChain = 'bsc';
          } else if (assetPlatform === 'polygon-pos' || assetPlatform === 'polygon') {
            mappedChain = 'polygon';
          } else if (assetPlatform === 'base') {
            mappedChain = 'base';
          } else if (assetPlatform === 'arbitrum-one' || assetPlatform === 'arbitrum') {
            mappedChain = 'arbitrum';
          } else if (assetPlatform === 'optimistic-ethereum' || assetPlatform === 'optimism') {
            mappedChain = 'optimism';
          } else if (assetPlatform === 'avalanche') {
            mappedChain = 'avalanche';
          }

          if (mappedChain) {
            // Filter by chain if specified
            if (chain && mappedChain !== chain) continue;

            // For native tokens, use a special address format or the coin ID
            // Note: Native tokens don't have contract addresses, so we'll skip them
            // unless the user specifically wants to handle them differently
            // For now, we'll include them with the coin ID as a placeholder
            const tokenKey = `${detail.id}:${mappedChain}`;
            if (seenTokens.has(tokenKey)) continue;
            seenTokens.add(tokenKey);

            // Skip native tokens without contract addresses for now
            // These would need special handling in the frontend
            // But let's include wrapped versions if they exist
            continue;
          }
        }

        // Also check detail_platforms (more detailed platform info)
        // This is important as some tokens only have data in detail_platforms
        if (detail.detail_platforms) {
          for (const [platform, platformInfo] of Object.entries(
            detail.detail_platforms
          )) {
            if (!platformInfo || typeof platformInfo !== 'object') continue;

            const contractAddress =
              'contract_address' in platformInfo &&
              typeof platformInfo.contract_address === 'string'
                ? platformInfo.contract_address
                : null;

            if (!contractAddress) continue;

            const mappedChain = platformMatchesChain(platform);
            if (!mappedChain) continue;

            const tokenKey = `${contractAddress.toLowerCase()}:${mappedChain}`;
            if (seenTokens.has(tokenKey)) continue;
            seenTokens.add(tokenKey);

            tokens.push({
              name: detail.name || '',
              symbol: (detail.symbol || '').toUpperCase(),
              address: contractAddress.toLowerCase(),
              chain: mappedChain,
              logoUrl: detail.image?.small,
              marketCap: detail.market_data?.market_cap?.usd,
              verified: true,
            });
          }
        }
      }

      // Log search results for debugging
      logger.info(
        {
          query,
          chain: chain || 'all',
          coinsFetched: coinsToFetch.length,
          successfulFetches,
          failedFetches,
          tokensFound: tokens.length,
          platformMapKeys: Object.keys(platformMap),
          demoMode: !hasApiKey,
        },
        'CoinGecko search results processed'
      );

      // RATE LIMIT FIX: If all fetches failed and we're in demo mode, throw error to trigger fallback
      if (tokens.length === 0 && failedFetches > 0 && !hasApiKey) {
        throw new Error(
          'CoinGecko demo mode rate limit exceeded. Add COINGECKO_API_KEY to .env.local for full functionality.'
        );
      }

      // When chain is specified, return more results (like CoinGecko chain pages)
      // Otherwise limit to prevent too many results
      const resultLimit = chain
        ? TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS * 5 // Up to 50 tokens when chain specified
        : TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS * 2; // Otherwise 20

      return tokens.slice(0, resultLimit);
    } catch (err) {
      // Handle SDK-specific errors at the search level
      if (err instanceof RateLimitError) {
        logger.error(
          {
            query,
            chain,
          },
          'CoinGecko rate limit exceeded during search'
        );
        throw new Error('CoinGecko rate limit exceeded. Please try again later.');
      } else if (err instanceof APIError) {
        logger.error(
          {
            query,
            chain,
            error: err.name,
            status: err.status,
          },
          `CoinGecko API error during search: ${err.name} (Status: ${err.status})`
        );
        throw new Error(
          `CoinGecko API error: ${err.name} (Status: ${err.status})`
        );
      } else {
        // Unexpected error
        logger.error(
          {
            error: err instanceof Error ? err : new Error(String(err)),
            query,
            chain,
          },
          'Unexpected error during CoinGecko search'
        );
        throw err instanceof Error
          ? err
          : new Error('An unexpected error occurred during search');
      }
    }
  }

  /**
   * Search Ethereum ecosystem - fetches all Ethereum tokens from Markets API
   * Similar to CoinGecko's Ethereum ecosystem category page
   * Returns tokens with Ethereum contract addresses, filtered by query if provided
   */
  private async searchEthereumEcosystem(
    query?: string
  ): Promise<TokenSearchResult[]> {
    try {
      const tokens: TokenSearchResult[] = [];
      const seenTokens = new Set<string>();
      const normalizedQuery = query?.toLowerCase().trim();

      // DEMO MODE FIX: Reduce pages when no API key
      const hasApiKey = !!(process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY);

      // Fetch multiple pages of Ethereum ecosystem tokens
      // Using category filter for ethereum-ecosystem and high per_page limit
      const pagesToFetch = !hasApiKey ? 1 : 5; // Fetch only 1 page in demo mode, 5 pages otherwise
      const perPage = !hasApiKey ? 10 : 100; // Limit results per page in demo mode

      const marketPromises = [];
      for (let page = 1; page <= pagesToFetch; page++) {
        const marketParams: Coingecko.Coins.Markets.MarketGetParams = {
          vs_currency: 'usd',
          category: 'ethereum-ecosystem',
          per_page: perPage,
          page: page,
          order: 'market_cap_desc',
          include_tokens: 'all', // Include all tokens, not just top ones
        };

        marketPromises.push(
          coingeckoClient.coins.markets.get(marketParams).catch((err) => {
            logger.warn(
              {
                error: err instanceof Error ? err : new Error(String(err)),
                page,
              },
              'Error fetching Ethereum ecosystem markets page'
            );
            return [];
          })
        );
      }

      // Execute all page fetches in parallel
      const marketResults = await Promise.allSettled(marketPromises);

      // Collect all coin IDs from markets
      const coinIds = new Set<string>();
      for (const result of marketResults) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          for (const market of result.value) {
            if (market.id) {
              // If query provided, filter by name/symbol match
              if (normalizedQuery) {
                const nameMatch =
                  market.name?.toLowerCase().includes(normalizedQuery);
                const symbolMatch =
                  market.symbol?.toLowerCase().includes(normalizedQuery);
                if (!nameMatch && !symbolMatch) {
                  continue;
                }
              }
              coinIds.add(market.id);
            }
          }
        }
      }

      // If no query or no matches from markets, also try search API
      if (normalizedQuery && coinIds.size === 0) {
        try {
          const searchParams: Coingecko.Search.SearchGetParams = {
            query: normalizedQuery,
          };
          const searchData = await coingeckoClient.search.get(searchParams);
          if (searchData?.coins) {
            for (const coin of searchData.coins.slice(0, 100)) {
              if (coin.id) coinIds.add(coin.id);
            }
          }
        } catch (err) {
          logger.warn(
            {
              error: err instanceof Error ? err : new Error(String(err)),
            },
            'Error in Ethereum ecosystem search fallback'
          );
        }
      }

      // Fetch detailed info for all coins in parallel
      const detailPromises = Array.from(coinIds).map(async (coinId) => {
        try {
          const detail = await coingeckoClient.coins.getID(coinId);
          return detail;
        } catch (err) {
          logger.warn(
            {
              error: err instanceof Error ? err : new Error(String(err)),
              coinId,
            },
            'Error fetching Ethereum token details'
          );
          return null;
        }
      });

      const detailResults = await Promise.allSettled(detailPromises);

      // Extract tokens with Ethereum contract addresses
      for (const result of detailResults) {
        if (result.status === 'rejected' || !result.value) continue;

        const detail = result.value;

        // Check platforms for Ethereum addresses
        if (detail.platforms?.ethereum) {
          const address = detail.platforms.ethereum;
          if (address && typeof address === 'string') {
            const tokenKey = `${address.toLowerCase()}:ethereum`;
            if (seenTokens.has(tokenKey)) continue;
            seenTokens.add(tokenKey);

            tokens.push({
              name: detail.name || '',
              symbol: (detail.symbol || '').toUpperCase(),
              address: address.toLowerCase(),
              chain: 'ethereum',
              logoUrl: detail.image?.small,
              marketCap: detail.market_data?.market_cap?.usd,
              verified: true,
            });
          }
        }

        // Also check detail_platforms
        if (detail.detail_platforms?.ethereum) {
          const platformInfo = detail.detail_platforms.ethereum;
          if (
            platformInfo &&
            typeof platformInfo === 'object' &&
            'contract_address' in platformInfo
          ) {
            const address =
              typeof platformInfo.contract_address === 'string'
                ? platformInfo.contract_address
                : null;
            if (address) {
              const tokenKey = `${address.toLowerCase()}:ethereum`;
              if (seenTokens.has(tokenKey)) continue;
              seenTokens.add(tokenKey);

              tokens.push({
                name: detail.name || '',
                symbol: (detail.symbol || '').toUpperCase(),
                address: address.toLowerCase(),
                chain: 'ethereum',
                logoUrl: detail.image?.small,
                marketCap: detail.market_data?.market_cap?.usd,
                verified: true,
              });
            }
          }
        }
      }

      logger.info(
        {
          query: normalizedQuery || 'all',
          tokensFound: tokens.length,
          coinsProcessed: coinIds.size,
          demoMode: !hasApiKey,
        },
        'Ethereum ecosystem search completed'
      );

      // RATE LIMIT FIX: If no tokens found in demo mode, throw error to trigger fallback
      if (tokens.length === 0 && !hasApiKey) {
        throw new Error(
          'CoinGecko demo mode rate limit exceeded. Add COINGECKO_API_KEY to .env.local for full functionality.'
        );
      }

      // Return up to 100 tokens (comprehensive ecosystem results), or 10 in demo mode
      const resultLimit = !hasApiKey ? 10 : 100;
      return tokens.slice(0, resultLimit);
    } catch (err) {
      // Handle SDK-specific errors
      if (err instanceof RateLimitError) {
        logger.error(
          {
            query,
          },
          'CoinGecko rate limit exceeded during Ethereum ecosystem search'
        );
        throw new Error(
          'CoinGecko rate limit exceeded. Please try again later.'
        );
      } else if (err instanceof APIError) {
        logger.error(
          {
            query,
            error: err.name,
            status: err.status,
          },
          `CoinGecko API error during Ethereum ecosystem search: ${err.name} (Status: ${err.status})`
        );
        throw new Error(
          `CoinGecko API error: ${err.name} (Status: ${err.status})`
        );
      } else {
        logger.error(
          {
            error: err instanceof Error ? err : new Error(String(err)),
            query,
          },
          'Unexpected error during Ethereum ecosystem search'
        );
        throw err instanceof Error
          ? err
          : new Error('An unexpected error occurred during search');
      }
    }
  }

  /**
   * Search DexScreener API with circuit breaker protection
   * PUBLIC WRAPPER: Uses circuit breaker to prevent cascading failures
   */
  private async searchDexScreener(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    if (!TokenSearchService.dexScreenerBreaker) {
      throw new Error('DexScreener circuit breaker not initialized');
    }
    return await TokenSearchService.dexScreenerBreaker.fire(query, chain);
  }

  /**
   * Search DexScreener API
   * INTERNAL METHOD: Contains actual fetch logic, called by circuit breaker
   */
  private async searchDexScreenerInternal(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TOKEN_SEARCH_CONFIG.API.DEXSCREENER_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    const chainMap = (TOKEN_SEARCH_CONFIG.CHAINS as any).DEXSCREENER_MAP;

    const tokens: TokenSearchResult[] = [];
    const seen = new Set<string>();

    for (const pair of data.pairs.slice(0, 20)) {
      const baseToken = pair.baseToken;
      if (!baseToken?.address) continue;

      const mappedChain =
        chainMap[pair.chainId as keyof typeof chainMap];
      if (!mappedChain) continue;

      // Filter by chain if specified
      if (chain && mappedChain !== chain) continue;

      const key = `${baseToken.address}:${mappedChain}`;
      if (seen.has(key)) continue;
      seen.add(key);

      tokens.push({
        name: baseToken.name || baseToken.symbol,
        symbol: baseToken.symbol || '',
        address: baseToken.address.toLowerCase(),
        chain: mappedChain,
        liquidity: pair.liquidity?.usd
          ? this.formatLiquidity(pair.liquidity.usd)
          : undefined,
        verified: false,
      });
    }

    return tokens;
  }

  /**
   * Search Moralis API (fallback)
   */
  private async searchMoralis(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    if (!this.moralisApiKey) {
      throw new Error('Moralis API key not configured');
    }

    // Moralis doesn't have a direct search endpoint
    // This is a placeholder for potential future implementation
    return [];
  }

  /**
   * Rank search results by relevance using configurable scoring weights
   */
  private rankResults(
    tokens: TokenSearchResult[],
    query: string
  ): TokenSearchResult[] {
    const weights = (TOKEN_SEARCH_CONFIG as any).RANKING;

    const scored = tokens.map((token) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const lowerSymbol = token.symbol.toLowerCase();
      const lowerName = token.name.toLowerCase();

      // Exact match bonus
      if (lowerSymbol === lowerQuery) score += weights.EXACT_SYMBOL_MATCH;
      if (lowerName === lowerQuery) score += weights.EXACT_NAME_MATCH;

      // Prefix match
      if (lowerSymbol.startsWith(lowerQuery)) score += weights.PREFIX_SYMBOL_MATCH;
      if (lowerName.startsWith(lowerQuery)) score += weights.PREFIX_NAME_MATCH;

      // Market cap ranking
      if (token.marketCap) {
        if (token.marketCap > 1_000_000_000)
          score += weights.MARKET_CAP_OVER_1B;
        else if (token.marketCap > 100_000_000)
          score += weights.MARKET_CAP_OVER_100M;
        else if (token.marketCap > 10_000_000)
          score += weights.MARKET_CAP_OVER_10M;
        else if (token.marketCap > 1_000_000)
          score += weights.MARKET_CAP_OVER_1M;
      }

      // Liquidity
      if (token.liquidity) {
        const liq = parseFloat(token.liquidity.replace(/[$K,M]/g, ''));
        if (liq > 1000) score += weights.LIQUIDITY_OVER_1M;
        else if (liq > 100) score += weights.LIQUIDITY_OVER_100K;
      }

      // Verification bonus
      if (token.verified) score += weights.VERIFIED_BONUS;

      return { token, score };
    });

    // Sort by score (descending), then market cap (descending), then name (alphabetical)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.token.marketCap && b.token.marketCap) {
        return b.token.marketCap - a.token.marketCap;
      }
      return a.token.name.localeCompare(b.token.name);
    });

    return scored.map((s) => s.token);
  }

  /**
   * Store tokens in database cache
   */
  private async storeInDatabase(tokens: TokenSearchResult[]): Promise<void> {
    for (const token of tokens) {
      try {
        await db
          .insert(tokenMetadata)
          .values({
            address: token.address,
            chain: token.chain,
            name: token.name,
            symbol: token.symbol,
            logoUrl: token.logoUrl,
            marketCap: token.marketCap ? String(token.marketCap) : undefined,
            liquidity: token.liquidity,
            verified: token.verified,
            lastUpdated: new Date(),
          })
          .onConflictDoUpdate({
            target: [tokenMetadata.address, tokenMetadata.chain],
            set: {
              name: token.name,
              symbol: token.symbol,
              logoUrl: token.logoUrl,
              marketCap: token.marketCap ? String(token.marketCap) : undefined,
              liquidity: token.liquidity,
              verified: token.verified,
              lastUpdated: new Date(),
            },
          });
      } catch (error) {
        console.warn(`Error storing token ${token.address}:`, error);
      }
    }
  }

  /**
   * Format liquidity value
   */
  private formatLiquidity(usd: number): string {
    if (usd >= 1_000_000) {
      return `$${(usd / 1_000_000).toFixed(2)}M`;
    } else if (usd >= 1_000) {
      return `$${(usd / 1_000).toFixed(2)}K`;
    } else {
      return `$${usd.toFixed(2)}`;
    }
  }

  /**
   * Get token by address (for reverse lookup)
   */
  async getTokenByAddress(
    address: string,
    chain: string
  ): Promise<TokenSearchResult | null> {
    try {
      const result = await db
        .select()
        .from(tokenMetadata)
        .where(
          sql`${tokenMetadata.address} = ${address.toLowerCase()} AND ${
            tokenMetadata.chain
          } = ${chain}`
        )
        .limit(1);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        name: row.name,
        symbol: row.symbol,
        address: row.address,
        chain: row.chain,
        logoUrl: row.logoUrl || undefined,
        marketCap: row.marketCap ? Number(row.marketCap) : undefined,
        liquidity: row.liquidity || undefined,
        verified: row.verified || false,
      };
    } catch (error) {
      console.error('Error fetching token by address:', error);
      return null;
    }
  }
}
