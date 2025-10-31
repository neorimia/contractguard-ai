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

interface CoinGeckoSearchResult {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number;
  }>;
}

interface CoinGeckoCoinDetail {
  id: string;
  symbol: string;
  name: string;
  image?: { small?: string };
  platforms?: Record<string, string>;
  market_data?: {
    market_cap?: { usd?: number };
  };
}

export class TokenSearchService {
  private coingeckoApiKey?: string;
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
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
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
   * INTERNAL METHOD: Contains actual fetch logic, called by circuit breaker
   * PERFORMANCE OPTIMIZATION: Parallelizes coin detail fetches (5s → <1s)
   */
  private async searchCoinGeckoInternal(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
      query
    )}`;

    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    if (this.coingeckoApiKey) {
      headers['x-cg-pro-api-key'] = this.coingeckoApiKey;
    }

    const response = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(TOKEN_SEARCH_CONFIG.API.COINGECKO_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoSearchResult = await response.json();

    // Fetch detailed info in parallel (not sequentially)
    const coinsToFetch = data.coins.slice(
      0,
      TOKEN_SEARCH_CONFIG.QUERY.MAX_RESULTS
    );

    // Create parallel fetch promises with proper error handling
    const detailPromises = coinsToFetch.map(async (coin) => {
      try {
        const detailUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}`;
        const detailResponse = await fetch(detailUrl, {
          headers,
          signal: AbortSignal.timeout(
            TOKEN_SEARCH_CONFIG.API.COINGECKO_TIMEOUT
          ),
        });

        if (!detailResponse.ok) return null;

        const detail: CoinGeckoCoinDetail = await detailResponse.json();
        return detail;
      } catch (error) {
        console.warn(`Error fetching details for ${coin.id}:`, error);
        return null;
      }
    });

    // Execute all fetches in parallel (max 5 concurrent to avoid rate limits)
    const detailResults = await Promise.allSettled(detailPromises);

    // Process results and extract token data
    const tokens: TokenSearchResult[] = [];
    const platformMap = TOKEN_SEARCH_CONFIG.CHAINS.PLATFORM_MAP;

    for (const result of detailResults) {
      if (result.status === 'rejected' || !result.value) continue;

      const detail = result.value;

      // Extract contract addresses from platforms
      if (detail.platforms) {
        for (const [platform, address] of Object.entries(detail.platforms)) {
          if (!address) continue;

          const mappedChain = platformMap[
            platform as keyof typeof platformMap
          ];
          if (!mappedChain) continue;

          // Filter by chain if specified
          if (chain && mappedChain !== chain) continue;

          tokens.push({
            name: detail.name,
            symbol: detail.symbol.toUpperCase(),
            address: address.toLowerCase(),
            chain: mappedChain,
            logoUrl: detail.image?.small,
            marketCap: detail.market_data?.market_cap?.usd,
            verified: true,
          });
        }
      }
    }

    return tokens;
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

    const chainMap = TOKEN_SEARCH_CONFIG.CHAINS.DEXSCREENER_MAP;

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
    const weights = TOKEN_SEARCH_CONFIG.RANKING;

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
