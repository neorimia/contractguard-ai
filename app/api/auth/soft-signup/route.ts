// app/api/auth/soft-signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, anonymousScans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmailService } from "@/lib/services/email.service";
import { Redis } from "@upstash/redis";

const emailService = new EmailService();

// Use Redis to temporarily store anonymous session mapping
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

/**
 * Soft Signup API - Email-only registration for anonymous users
 *
 * Flow:
 * 1. User provides email after 2-3 anonymous scans
 * 2. Check if email already exists
 * 3. Send magic link to complete registration
 * 4. Store anonymous session ID in Redis (for 1 hour) for later migration
 * 5. User clicks magic link → signs up via Stack Auth
 * 6. After Stack Auth signup, migration happens automatically in auth sync
 */
export async function POST(req: NextRequest) {
  try {
    const { email, anonymousSessionId } = await req.json();

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Invalid email address",
          status: "error",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in our database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          error: "Email already registered",
          message: "This email is already registered. Please sign in instead.",
          action: "redirect_to_signin",
          status: "error",
        },
        { status: 409 }
      );
    }

    // Store anonymous session mapping in Redis (1 hour TTL)
    // This will be retrieved when user completes signup
    if (anonymousSessionId) {
      const sessionKey = `soft_signup:${normalizedEmail}`;
      await redis.set(sessionKey, anonymousSessionId, { ex: 3600 }); // 1 hour
      console.log(
        `Stored anonymous session mapping: ${normalizedEmail} → ${anonymousSessionId}`
      );
    }

    // Generate magic token for our email service
    const magicToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in Redis temporarily (Stack Auth will create the actual user)
    const tokenKey = `magic_token:${magicToken}`;
    await redis.set(
      tokenKey,
      JSON.stringify({
        email: normalizedEmail,
        anonymousSessionId,
        expiresAt: expiresAt.toISOString(),
      }),
      { ex: 3600 } // 1 hour
    );

    // Get scan count for email
    const scanCount = anonymousSessionId
      ? await getAnonymousScanCount(anonymousSessionId)
      : 0;
    const scansRemaining = Math.max(0, 3 - scanCount);

    // Send magic link email
    await emailService.sendMagicLink(
      normalizedEmail,
      magicToken,
      scansRemaining
    );

    return NextResponse.json({
      status: "success",
      message: "Check your email for the magic link",
      email: normalizedEmail,
    });
  } catch (error: any) {
    console.error("Soft signup error:", error);
    return NextResponse.json(
      {
        error: "Signup failed",
        details: error.message,
        status: "error",
      },
      { status: 500 }
    );
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get anonymous scan count from session
 */
async function getAnonymousScanCount(sessionId: string): Promise<number> {
  const scans = await db
    .select()
    .from(anonymousScans)
    .where(eq(anonymousScans.sessionId, sessionId));

  return scans.length;
}
