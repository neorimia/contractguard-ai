// app/api/tokens/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TokenSearchService } from '@/lib/services/token-search.service';

export const runtime = 'edge';

/**
 * GET /api/tokens/search?q=pepe&chain=ethereum
 * Search for tokens by name or symbol
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const chain = searchParams.get('chain');

    // Validate query parameter
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          error: 'Query must be at least 2 characters',
          status: 'error',
        },
        { status: 400 }
      );
    }

    // Validate chain parameter (if provided)
    const validChains = [
      'ethereum',
      'bsc',
      'polygon',
      'base',
      'arbitrum',
      'optimism',
      'avalanche',
    ];

    if (chain && !validChains.includes(chain.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid chain. Must be one of: ${validChains.join(', ')}`,
          status: 'error',
        },
        { status: 400 }
      );
    }

    // Perform search
    const service = new TokenSearchService();
    const results = await service.searchTokens(
      query,
      chain?.toLowerCase() || undefined
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
    console.error('Token search API error:', error);

    // Check for rate limiting
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('rate limit')
    ) {
      return NextResponse.json(
        {
          error: 'Search rate limit exceeded. Please try again in a moment.',
          details: error.message,
          status: 'error',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Search temporarily unavailable',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred',
        status: 'error',
      },
      { status: 503 }
    );
  }
}
