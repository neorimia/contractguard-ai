/**
 * Instant Checkout API
 *
 * Creates Stripe checkout session for one-time instant report purchases
 * Supports both authenticated users and guest checkouts
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import Stripe from "stripe";
import { db } from "@/db";
import { purchases, users } from "@/db/schema";
import { getInstantPackageByIndex } from "@/lib/config/pricing";
import crypto from "crypto";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

/**
 * Ensure Stack Auth user exists in local database
 * Returns local user ID or null for guests
 */
async function ensureUserExists(stackUser: any): Promise<number | null> {
  if (!stackUser) return null;

  // Check if user already exists in local DB
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.stackUserId, stackUser.id))
    .limit(1);

  if (existingUser.length > 0) {
    return existingUser[0].id;
  }

  // Create new user record
  const newUser = await db
    .insert(users)
    .values({
      stackUserId: stackUser.id,
      email: stackUser.primaryEmail || `user-${stackUser.id}@temp.local`,
      emailVerified: stackUser.primaryEmailVerified || false,
      displayName: stackUser.displayName || null,
      tier: "free",
      scansToday: 0,
      instantCredits: 0,
    })
    .returning({ id: users.id });

  return newUser[0].id;
}

export async function POST(req: NextRequest) {
  try {
    const { packageIndex, contractAddress, guestEmail } = await req.json();

    // Validate package
    const pkg = getInstantPackageByIndex(packageIndex);
    if (!pkg) {
      return NextResponse.json(
        {
          error: "Invalid package",
          details: "Please select a valid instant report package",
        },
        { status: 400 }
      );
    }

    // Validate price ID is configured
    if (!pkg.stripePriceId || pkg.stripePriceId.trim() === "") {
      return NextResponse.json(
        {
          error: "Package not configured",
          details: `The ${pkg.credits}-credit package is not properly configured. Please contact support.`,
        },
        { status: 500 }
      );
    }

    // Check if user is authenticated
    const stackUser = await stackServerApp.getUser();
    const isGuest = !stackUser;

    // Ensure authenticated user exists in local database
    const localUserId = await ensureUserExists(stackUser);

    // Generate guest session ID for anonymous users
    const guestSessionId = isGuest ? crypto.randomUUID() : null;

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    // Determine success URL based on contract address
    const successUrl = contractAddress
      ? `${siteUrl}/report/${contractAddress}?session_id={CHECKOUT_SESSION_ID}&success=true`
      : `${siteUrl}/account?session_id={CHECKOUT_SESSION_ID}&success=true`;

    const cancelUrl = contractAddress
      ? `${siteUrl}/report/${contractAddress}?canceled=true`
      : `${siteUrl}/pricing?canceled=true`;

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // ← One-time payment mode
      payment_method_types: ["card"],
      line_items: [
        {
          price: pkg.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,

      // Track purchase metadata
      metadata: {
        type: "instant_credits",
        credits: pkg.credits.toString(),
        userId: localUserId?.toString() || "",
        guestSessionId: guestSessionId || "",
        contractAddress: contractAddress || "",
      },

      // Optional: collect email for guest users
      ...(isGuest && guestEmail ? { customer_email: guestEmail } : {}),

      // Allow promo codes
      allow_promotion_codes: true,
    });

    // Create purchase record
    await db.insert(purchases).values({
      userId: localUserId,
      guestSessionId,
      guestEmail: guestEmail || null,
      type: "instant_credits",
      credits: pkg.credits,
      amount: Math.round(pkg.price * 100), // Convert to cents
      currency: "usd",
      stripeCheckoutSessionId: session.id,
      status: "pending",
      metadata: {
        packageSize: pkg.credits,
        ipAddress: req.headers.get("x-forwarded-for") || "",
        userAgent: req.headers.get("user-agent") || "",
        contractAddress: contractAddress || "",
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      status: "success",
    });
  } catch (error: any) {
    console.error("Instant checkout error:", error);
    return NextResponse.json(
      {
        error: "Checkout failed",
        details: error.message || "Unknown error occurred",
        status: "error",
      },
      { status: 500 }
    );
  }
}
