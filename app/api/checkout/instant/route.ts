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
import { purchases } from "@/db/schema";
import { getInstantPackageByIndex } from "@/lib/config/pricing";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    const { packageIndex, contractAddress, guestEmail } = await req.json();

    // Validate package
    const pkg = getInstantPackageByIndex(packageIndex);
    if (!pkg || !pkg.stripePriceId) {
      return NextResponse.json(
        {
          error: "Invalid package",
          details: "Please select a valid instant report package",
        },
        { status: 400 },
      );
    }

    // Check if user is authenticated
    const stackUser = await stackServerApp.getUser();
    const isGuest = !stackUser;

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
        userId: stackUser?.id || "",
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
      userId: stackUser ? parseInt(stackUser.id) : null,
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
        ipAddress: req.headers.get("x-forwarded-for") || req.ip || "",
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
      { status: 500 },
    );
  }
}
