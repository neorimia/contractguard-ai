// app/api/auth/verify-magic-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * Verify Magic Link API
 * Called when user clicks the magic link from their email
 * Redirects to Stack Auth signup with pre-filled email
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=invalid_token`
      );
    }

    // Retrieve token data from Redis
    const tokenKey = `magic_token:${token}`;
    const tokenDataStr = await redis.get(tokenKey);

    if (!tokenDataStr) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=expired_token`
      );
    }

    const tokenData = JSON.parse(tokenDataStr as string);

    // Check if token is expired
    const expiresAt = new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      await redis.del(tokenKey);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=expired_token`
      );
    }

    // Delete token (one-time use)
    await redis.del(tokenKey);

    // Redirect to Stack Auth signup with pre-filled email
    // The anonymous session will be migrated after user completes signup
    const redirectUrl = new URL(
      `${process.env.NEXT_PUBLIC_SITE_URL}/handler/sign-up`
    );
    redirectUrl.searchParams.set("email", tokenData.email);
    redirectUrl.searchParams.set("soft_signup", "true");

    if (tokenData.anonymousSessionId) {
      redirectUrl.searchParams.set("session", tokenData.anonymousSessionId);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error("Magic link verification error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/error?reason=verification_failed`
    );
  }
}
