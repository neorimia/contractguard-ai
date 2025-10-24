// lib/middleware/rate-limit.ts
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "./auth.middleware";
import { AuthService } from "@/lib/services/auth.service";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Rate limiting now uses AuthService.checkScanLimit() which respects
// the monthly limits from PRICING_LIMITS configuration
// This ensures consistency across all scan limit checks

export async function checkRateLimit(
  identifier: string, // IP or user ID
  tier: "free" | "pro" | "enterprise" = "free"
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // This function is deprecated - use AuthService.checkScanLimit() instead
  // which properly handles monthly limits from PRICING_LIMITS
  console.warn(
    "checkRateLimit is deprecated. Use AuthService.checkScanLimit() instead."
  );

  // For backward compatibility, return a permissive result
  return {
    allowed: true,
    remaining: -1, // Unknown
    resetAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
  };
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
      // Generate appropriate error message based on user tier
      let errorMessage = "Scan limit exceeded";
      let upgradeUrl = "/pricing";

      if (user.tier === "free") {
        errorMessage =
          "You've used all your free scans. Upgrade to a subscription plan for more scans!";
      } else if (["starter", "pro", "team"].includes(user.tier)) {
        errorMessage = `You've used all your monthly scans. Additional scans are available with overage pricing.`;
        upgradeUrl = "/billing"; // Direct to billing for overage
      } else {
        errorMessage = "Your limit will reset soon.";
      }

      return NextResponse.json(
        {
          error: "Scan limit exceeded",
          message: errorMessage,
          scansRemaining: 0,
          resetAt: resetAt.toISOString(),
          upgradeUrl,
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
