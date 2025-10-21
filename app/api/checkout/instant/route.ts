/**
 * Instant Checkout API
 *
 * Creates Stripe checkout session for one-time instant purchases
 * Handles both general credit purchases and contract-specific reports
 * Supports authenticated users only
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
import { paymentService } from "@/lib/services/payment.service";
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
    const body = await req.json();
    const {
      packageIndex,
      contractAddress,
      chain = "ethereum",
      credits,
      price,
      stripePriceId,
      userEmail,
    } = body;

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

    // Additional validation for contract-specific purchases
    if (contractAddress) {
      // Validate contract address format (basic Ethereum address validation)
      if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        return NextResponse.json(
          {
            error: "Invalid contract address format",
            details:
              "Contract address must be a valid Ethereum address (0x...)",
          },
          { status: 400 }
        );
      }

      // Validate chain
      const validChains = ["ethereum", "bsc", "polygon", "arbitrum"];
      if (!validChains.includes(chain)) {
        return NextResponse.json(
          {
            error: "Invalid chain",
            details: `Chain must be one of: ${validChains.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Validate package data matches what was sent (for contract-specific purchases)
      if (credits !== undefined && price !== undefined) {
        if (credits !== pkg.credits || price !== pkg.price) {
          return NextResponse.json(
            {
              error: "Package data mismatch",
              details: "Package information does not match selected package",
            },
            { status: 400 }
          );
        }
      }
    }

    // Check if user is authenticated (required for instant purchases)
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const isGuest = false; // No longer supporting guest purchases

    // Ensure authenticated user exists in local database (now required)
    const localUserId = await ensureUserExists(stackUser);

    if (!localUserId) {
      return NextResponse.json(
        {
          error: "Account setup failed",
          details: "Unable to set up your account. Please try again.",
        },
        { status: 500 }
      );
    }

    // Check instant report purchase limits (for contract-specific purchases)
    if (contractAddress) {
      const limitCheck = await paymentService.checkInstantReportLimits(
        localUserId,
        undefined // No guest session since authentication is required
      );

      if (!limitCheck.canPurchase) {
        return NextResponse.json(
          {
            error: "Purchase limit reached",
            details: limitCheck.reason,
            limitInfo: limitCheck.limitInfo,
          },
          { status: 429 }
        );
      }
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    // Determine success URL based on contract address
    const successUrl = contractAddress
      ? `${siteUrl}/report/${contractAddress}?chain=${chain}&session_id={CHECKOUT_SESSION_ID}&success=true`
      : `${siteUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`;

    const cancelUrl = contractAddress
      ? `${siteUrl}/report/${contractAddress}?chain=${chain}&canceled=true`
      : `${siteUrl}/pricing?canceled=true`;

    // Get or create Stripe customer for authenticated user
    let customerId: string;
    try {
      const customer = await stripeService.getOrCreateCustomer({
        email: stackUser.primaryEmail,
        userId: localUserId.toString(),
        name: stackUser.displayName || undefined,
      });
      customerId = customer.id;
    } catch (error) {
      console.error("Error getting/creating Stripe customer:", error);
      return NextResponse.json(
        {
          error: "Account setup failed",
          details: "Unable to set up payment account. Please try again.",
        },
        { status: 500 }
      );
    }

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

      // Customer and metadata
      customer: customerId,

      // Pre-fill customer email if provided
      customer_email: userEmail || stackUser.primaryEmail,

      // Track purchase metadata
      metadata: {
        type: contractAddress ? "instant_report" : "instant_credits",
        credits: pkg.credits.toString(),
        userId: localUserId.toString(),
        contractAddress: contractAddress || "",
        chain: contractAddress ? chain : "",
        packageIndex: packageIndex?.toString() || "0",
        price: pkg.price.toString(),
      },

      // Allow promo codes
      allow_promotion_codes: true,
    });

    // Create purchase record
    const [purchaseRecord] = await db
      .insert(purchases)
      .values({
        userId: localUserId,
        guestSessionId: null, // No guest sessions for authenticated purchases
        guestEmail: null, // No guest email for authenticated purchases
        type: contractAddress ? "instant_credits" : "instant_credits", // Use existing type, will be processed as instant report
        credits: pkg.credits,
        amount: Math.round(pkg.price * 100), // Convert to cents
        currency: "usd",
        stripeCheckoutSessionId: session.id,
        status: "pending",
        metadata: {
          packageSize: pkg.credits,
          ipAddress:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "",
          userAgent: req.headers.get("user-agent") || "",
          contractAddress: contractAddress || "",
        },
      })
      .returning({ id: purchases.id });

    const purchaseId = purchaseRecord.id;

    // Create instant report record for contract-specific purchases
    let instantReportId: string | undefined;
    if (contractAddress) {
      const instantReport = await paymentService.createInstantReport({
        userId: localUserId,
        guestSessionId: undefined, // No guest sessions for authenticated purchases
        contractAddress,
        chain,
        purchaseId,
        amount: Math.round(pkg.price * 100),
        expiresInHours: 24,
      });
      instantReportId = instantReport.id;
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      purchaseId,
      instantReportId,
      price: pkg.price,
      credits: pkg.credits,
      packageIndex,
      contractAddress: contractAddress || null,
      chain: contractAddress ? chain : null,
      status: "success",
    });
  } catch (error: any) {
    console.error("Instant checkout error:", error);

    // Handle specific error types
    if (error.message?.includes("price")) {
      return NextResponse.json(
        {
          error: "Payment configuration error",
          details:
            "Instant report pricing is not properly configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    if (error.message?.includes("customer")) {
      return NextResponse.json(
        {
          error: "Account setup error",
          details: "Unable to set up payment account. Please try again.",
        },
        { status: 500 }
      );
    }

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
