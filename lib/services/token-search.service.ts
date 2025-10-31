// lib/services/token-search.service.ts
import { redis } from '@/lib/redis';
import { db } from '@/db';
import { tokenMetadata, type TokenMetadata } from '@/db/schema';
import { eq, or, like, desc, sql } from 'drizzle-orm';

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

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
    this.moralisApiKey = process.env.MORALIS_API_KEY;
  }

  /**
   * Search for tokens by name or symbol
   */
  async searchTokens(
    query: string,
    chain?: string
  ): Promise<TokenSearchResponse> {
    if (!query || query.length < 2) {
      return {
        tokens: [],
        source: 'cache',
        cached: true,
      };
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `token:search:${normalizedQuery}:${chain || 'all'}`;

    // Check Redis cache first (5-minute TTL)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return {
          tokens: JSON.parse(cached as string),
          source: 'cache',
          cached: true,
        };
      }
    } catch (error) {
      console.warn('Redis cache error:', error);
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

        // Cache in Redis for 5 minutes
        try {
          await redis.set(cacheKey, JSON.stringify(dbResults), { ex: 300 });
        } catch (error) {
          console.warn('Redis set error:', error);
        }

        return response;
      }
    } catch (error) {
      console.error('Database search error:', error);
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
    const rankedTokens = this.rankResults(tokens, normalizedQuery).slice(0, 10);

    // Cache results
    try {
      await redis.set(cacheKey, JSON.stringify(rankedTokens), { ex: 300 });
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }

    // Store in database for 24-hour cache
    try {
      await this.storeInDatabase(rankedTokens);
    } catch (error) {
      console.warn('Database storage error:', error);
    }

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
      .limit(10);

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
   * Search CoinGecko API
   */
  private async searchCoinGecko(
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

    const response = await fetch(searchUrl, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoSearchResult = await response.json();

    // Fetch detailed info for each coin to get contract addresses
    const tokens: TokenSearchResult[] = [];

    for (const coin of data.coins.slice(0, 10)) {
      try {
        const detailUrl = `https://api.coingecko.com/api/v3/coins/${coin.id}`;
        const detailResponse = await fetch(detailUrl, { headers });

        if (!detailResponse.ok) continue;

        const detail: CoinGeckoCoinDetail = await detailResponse.json();

        // Extract contract addresses from platforms
        if (detail.platforms) {
          const platformMap: Record<string, string> = {
            ethereum: 'ethereum',
            'binance-smart-chain': 'bsc',
            'polygon-pos': 'polygon',
            base: 'base',
            arbitrum: 'arbitrum',
            optimism: 'optimism',
          };

          for (const [platform, address] of Object.entries(detail.platforms)) {
            if (!address) continue;

            const mappedChain = platformMap[platform];
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
      } catch (error) {
        console.warn(`Error fetching details for ${coin.id}:`, error);
      }
    }

    return tokens;
  }

  /**
   * Search DexScreener API
   */
  private async searchDexScreener(
    query: string,
    chain?: string
  ): Promise<TokenSearchResult[]> {
    const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(
      query
    )}`;

    const response = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    const chainMap: Record<string, string> = {
      ethereum: 'ethereum',
      bsc: 'bsc',
      polygon: 'polygon',
      base: 'base',
      arbitrum: 'arbitrum',
      optimism: 'optimism',
    };

    const tokens: TokenSearchResult[] = [];
    const seen = new Set<string>();

    for (const pair of data.pairs.slice(0, 20)) {
      const baseToken = pair.baseToken;
      if (!baseToken?.address) continue;

      const mappedChain = chainMap[pair.chainId];
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
   * Rank search results by relevance
   */
  private rankResults(
    tokens: TokenSearchResult[],
    query: string
  ): TokenSearchResult[] {
    const scored = tokens.map((token) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const lowerSymbol = token.symbol.toLowerCase();
      const lowerName = token.name.toLowerCase();

      // Exact match bonus (40 points)
      if (lowerSymbol === lowerQuery) score += 40;
      if (lowerName === lowerQuery) score += 30;

      // Prefix match (20 points)
      if (lowerSymbol.startsWith(lowerQuery)) score += 20;
      if (lowerName.startsWith(lowerQuery)) score += 15;

      // Market cap ranking (20 points)
      if (token.marketCap) {
        if (token.marketCap > 1_000_000_000) score += 20; // >$1B
        else if (token.marketCap > 100_000_000) score += 15; // >$100M
        else if (token.marketCap > 10_000_000) score += 10; // >$10M
        else if (token.marketCap > 1_000_000) score += 5; // >$1M
      }

      // Liquidity (10 points)
      if (token.liquidity) {
        const liq = parseFloat(token.liquidity.replace(/[$K,M]/g, ''));
        if (liq > 1000) score += 10; // >$1M
        else if (liq > 100) score += 5; // >$100K
      }

      // Verification bonus (10 points)
      if (token.verified) score += 10;

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
