// lib/middleware/rate-limit.ts
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
url: process.env.UPSTASH_REDIS_URL!,
token: process.env.UPSTASH_REDIS_TOKEN!,
});

interface RateLimitConfig {
free: { limit: number; window: number };
pro: { limit: number; window: number };
enterprise: { limit: number; window: number };
}

const RATE_LIMITS: RateLimitConfig = {
free: { limit: 3, window: 24 * 60 * 60 }, // 3 per day
pro: { limit: 1000, window: 24 * 60 * 60 }, // 1000 per day
enterprise: { limit: 10000, window: 24 * 60 * 60 }, // 10k per day
};

export async function checkRateLimit(
identifier: string, // IP or user ID
tier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
const config = RATE_LIMITS[tier];
const key = `ratelimit:${tier}:${identifier}`;

try {
const current = await redis.get<number>(key);
const now = Math.floor(Date.now() / 1000);

    if (!current) {
      // First request
      await redis.set(key, 1, { ex: config.window });
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: now + config.window,
      };
    }

    if (current >= config.limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + ttl,
      };
    }

    // Increment counter
    await redis.incr(key);
    const ttl = await redis.ttl(key);

    return {
      allowed: true,
      remaining: config.limit - current - 1,
      resetAt: now + ttl,
    };
} catch (error) {
console.error('Rate limit check failed:', error);
// Fail open - allow request if Redis fails
return { allowed: true, remaining: 0, resetAt: 0 };
}
}

// Middleware function
export async function rateLimitMiddleware(
req: NextRequest,
tier: 'free' | 'pro' | 'enterprise' = 'free'
) {
// Get identifier (IP or user session)
const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
const identifier = ip.split(',')[0].trim();

const result = await checkRateLimit(identifier, tier);

if (!result.allowed) {
return NextResponse.json(
{
error: 'Rate limit exceeded',
message: `You've reached your ${tier} tier limit. Upgrade for unlimited scans.`,
resetAt: result.resetAt,
upgradeUrl: '/pricing',
},
{
status: 429,
headers: {
'X-RateLimit-Limit': RATE_LIMITS[tier].limit.toString(),
'X-RateLimit-Remaining': '0',
'X-RateLimit-Reset': result.resetAt.toString(),
},
}
);
}

return {
allowed: true,
headers: {
'X-RateLimit-Limit': RATE_LIMITS[tier].limit.toString(),
'X-RateLimit-Remaining': result.remaining.toString(),
'X-RateLimit-Reset': result.resetAt.toString(),
},
};
}

// Usage in API route
// import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
//
// export async function POST(req: NextRequest) {
//   const rateLimit = await rateLimitMiddleware(req, 'free');
//   if (!rateLimit.allowed) return rateLimit;
//   
//   // Continue with API logic...
// }
