// app/api/tokens/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TokenSearchService } from '@/lib/services/token-search.service';
import { TOKEN_SEARCH_CONFIG } from '@/lib/services/token-search.config';
import {
  tokenSearchRateLimit,
  getClientIdentifier,
  getRateLimitHeaders,
} from '@/lib/rate-limit';
import { createLogger, getRequestContext } from '@/lib/logger';

const logger = createLogger({ api: 'token-search' });

export const runtime = 'edge';

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  code: string;
  status: 'error';
  details?: string;
  retryAfter?: number;
}

/**
 * GET /api/tokens/search?q=pepe&chain=ethereum
 * Search for tokens by name or symbol with rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = getClientIdentifier(request);
    const { success, limit, remaining, reset } =
      await tokenSearchRateLimit.limit(identifier);

    // Add rate limit headers to all responses
    const rateLimitHeaders = getRateLimitHeaders(limit, remaining, reset);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 'error',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        } as ErrorResponse,
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const chain = searchParams.get('chain');

    // Validate query parameter
    if (!query || query.length < TOKEN_SEARCH_CONFIG.QUERY.MIN_LENGTH) {
      return NextResponse.json(
        {
          error: `Query must be at least ${TOKEN_SEARCH_CONFIG.QUERY.MIN_LENGTH} characters`,
          code: 'INVALID_QUERY',
          status: 'error',
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate chain parameter (if provided)
    const validChains = TOKEN_SEARCH_CONFIG.CHAINS.VALID;

    if (chain && !validChains.includes(chain.toLowerCase() as any)) {
      return NextResponse.json(
        {
          error: `Invalid chain. Must be one of: ${validChains.join(', ')}`,
          code: 'INVALID_CHAIN',
          status: 'error',
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Perform search with timing
    const startTime = Date.now();
    const service = new TokenSearchService();
    const results = await service.searchTokens(
      query,
      chain?.toLowerCase() || undefined
    );
    const durationMs = Date.now() - startTime;

    // Log successful search with metrics
    logger.info(
      {
        query,
        chain: chain || 'all',
        source: results.source,
        cached: results.cached,
        resultCount: results.tokens.length,
        durationMs,
        ...getRequestContext(request),
      },
      'Token search completed'
    );

    // Return results
    return NextResponse.json({
      data: results.tokens,
      meta: {
        source: results.source,
        cached: results.cached,
        count: results.tokens.length,
        query: query,
        chain: chain || 'all',
      },
      status: 'success',
    });
  } catch (error) {
    // Log error with full context
    logger.error(
      {
        error: error instanceof Error ? error : new Error(String(error)),
        ...getRequestContext(request),
      },
      'Token search API error'
    );

    // Check for rate limiting
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('rate limit')
    ) {
      return NextResponse.json(
        {
          error: 'Search rate limit exceeded. Please try again in a moment.',
          code: 'RATE_LIMIT_EXCEEDED',
          details: error.message,
          status: 'error',
          retryAfter: 60,
        } as ErrorResponse,
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // Check for timeout errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('timeout'))
    ) {
      return NextResponse.json(
        {
          error: 'Search request timed out. Please try again.',
          code: 'TIMEOUT',
          details: 'External API timeout',
          status: 'error',
          retryAfter: 5,
        } as ErrorResponse,
        { status: 504 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Search temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        details:
          error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        retryAfter: 30,
      } as ErrorResponse,
      { status: 503 }
    );
  }
}
