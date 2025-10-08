// lib/middleware/rate-limit.ts
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "./auth.middleware";
import { AuthService } from "@/lib/services/auth.service";

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
  pro: { limit: 100, window: 24 * 60 * 60 }, // 100 per day
  enterprise: { limit: -1, window: 24 * 60 * 60 }, // unlimited
};

export async function checkRateLimit(
  identifier: string, // IP or user ID
  tier: "free" | "pro" | "enterprise" = "free"
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
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: 0, resetAt: 0 };
  }
}

// Middleware function with user authentication integration
export async function rateLimitMiddleware(req: NextRequest) {
  try {
    // Get authenticated user from request headers
    const user = getUserFromRequest(req);

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    // Check scan limit using AuthService
    const authService = new AuthService();
    const { allowed, scansRemaining, resetAt } =
      await authService.checkScanLimit(user.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Scan limit exceeded",
          message: `You've used all your scans for today. ${user.tier === "free" ? "Upgrade to Pro for more scans!" : "Your limit will reset soon."}`,
          scansRemaining: 0,
          resetAt: resetAt.toISOString(),
          upgradeUrl: "/pricing",
          status: "error",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetAt.toISOString(),
          },
        }
      );
    }

    // Increment scan count
    await authService.incrementScanCount(user.id);

    // Return success response for Next.js middleware
    return NextResponse.next({
      headers: {
        "X-RateLimit-Remaining": scansRemaining.toString(),
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    return NextResponse.json(
      { error: "Rate limit check failed", status: "error" },
      { status: 500 }
    );
  }
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
