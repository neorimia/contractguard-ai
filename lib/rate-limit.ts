// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

/**
 * Rate Limiter Configuration
 *
 * Implements sliding window rate limiting with Upstash Redis
 * to prevent API abuse and control costs.
 */

// Token search rate limit: 10 requests per 10 seconds per IP
export const tokenSearchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:token-search',
});

// General API rate limit: 30 requests per minute per IP
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Strict rate limit for expensive operations: 5 requests per minute
export const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:strict',
});

/**
 * Get client identifier from request
 * Uses IP address or falls back to a default identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a default identifier
  // In production, you might want to use other identifiers like API keys
  return 'anonymous';
}

/**
 * Helper function to format rate limit response headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
    'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
  };
}