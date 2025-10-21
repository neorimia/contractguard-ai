/**
 * Instant Report Payment Endpoint
 *
 * Creates Stripe checkout session for individual instant report purchases
 * Handles payments for specific contract addresses without requiring signup
 */

import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe.service";
import { paymentService } from "@/lib/services/payment.service";
import { db } from "@/db";
import { instantReports, purchases, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import Stripe from "stripe";
import { PRICING_CONFIG } from "@/lib/config/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Price constants removed - now using dynamic package-based pricing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contractAddress,
      chain = "ethereum",
      packageIndex,
      credits,
      price,
      stripePriceId,
    } = body;

    // Input validation
    if (!contractAddress || typeof contractAddress !== "string") {
      return NextResponse.json(
        {
          error: "Invalid contract address",
          details: "Contract address is required and must be a valid string",
        },
        { status: 400 }
      );
    }

    // Validate contract address format (basic Ethereum address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        {
          error: "Invalid contract address format",
          details: "Contract address must be a valid Ethereum address (0x...)",
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

    // Validate package information
    let selectedPackage;
    if (packageIndex !== undefined && typeof packageIndex === "number") {
      // Validate package index
      if (
        packageIndex < 0 ||
        packageIndex >= PRICING_CONFIG.instant.packages.length
      ) {
        return NextResponse.json(
          {
            error: "Invalid package selection",
            details: "Package index is out of range",
          },
          { status: 400 }
        );
      }

      selectedPackage = PRICING_CONFIG.instant.packages[packageIndex];

      // Validate package data matches what was sent
      if (
        credits !== selectedPackage.credits ||
        price !== selectedPackage.price
      ) {
        return NextResponse.json(
          {
            error: "Package data mismatch",
            details: "Package information does not match selected package",
          },
          { status: 400 }
        );
      }
    } else {
      // Fallback to default single report package (for backward compatibility)
      selectedPackage = PRICING_CONFIG.instant.packages[0];
    }

    // Use the selected package or default values
    const reportPrice = selectedPackage.price;
    const reportPriceCents = Math.round(reportPrice * 100);
    const reportCredits = selectedPackage.credits;
    const reportStripePriceId = selectedPackage.stripePriceId || stripePriceId;

    // Get authenticated user (required for instant reports)
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    const isGuest = false; // No longer supporting guest purchases

    // Ensure user exists in local database (now required)
    let localUserId: number;
    try {
      // Check if user already exists in local DB
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.stackUserId, stackUser.id))
        .limit(1);

      if (existingUser) {
        localUserId = existingUser.id;
      } else {
        // Create new user record for authenticated user
        const [newUser] = await db
          .insert(users)
          .values({
            stackUserId: stackUser.id,
            email: stackUser.primaryEmail!,
            emailVerified: stackUser.primaryEmailVerified || false,
            displayName: stackUser.displayName || null,
            tier: "free",
            scansToday: 0,
            instantCredits: 0,
          })
          .returning({ id: users.id });

        localUserId = newUser.id;
      }
    } catch (error) {
      console.error("Error ensuring user exists:", error);
      return NextResponse.json(
        {
          error: "Account setup failed",
          details: "Unable to set up your account. Please try again.",
        },
        { status: 500 }
      );
    }

    // Check instant report purchase limits
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

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    // Create redirect URLs
    const successUrl = `${siteUrl}/report/${contractAddress}?chain=${chain}&session_id={CHECKOUT_SESSION_ID}&success=true`;
    const cancelUrl = `${siteUrl}/report/${contractAddress}?chain=${chain}&canceled=true`;

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

    // Check if instant report price ID is configured
    const instantReportPriceId =
      reportStripePriceId ||
      process.env.STRIPE_PRICE_INSTANT_REPORT ||
      process.env.STRIPE_PRICE_INSTANT_1;
    if (!instantReportPriceId) {
      return NextResponse.json(
        {
          error: "Payment configuration error",
          details:
            "Instant report pricing is not properly configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Create Stripe checkout session for instant report (one-time payment)
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // One-time payment mode
      payment_method_types: ["card"],
      line_items: [
        {
          price: instantReportPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,

      // Customer and metadata
      customer: customerId,

      // Track purchase metadata
      metadata: {
        type: "instant_report",
        userId: localUserId.toString(),
        contractAddress: contractAddress,
        chain: chain,
        packageIndex: packageIndex?.toString() || "0",
        credits: reportCredits.toString(),
        price: reportPrice.toString(),
      },

      // Allow promo codes
      allow_promotion_codes: true,
    });

    // Create purchase record in database
    const [purchaseRecord] = await db
      .insert(purchases)
      .values({
        userId: localUserId,
        guestSessionId: null, // No guest sessions for authenticated purchases
        guestEmail: null, // No guest email for authenticated purchases
        type: "instant_credits", // Use existing type, will be processed as instant report
        amount: reportPriceCents,
        currency: "usd",
        stripeCheckoutSessionId: session.id,
        status: "pending",
        metadata: {
          contractAddress,
          packageSize: reportCredits, // Using existing packageSize field for credits
          ipAddress:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "",
          userAgent: req.headers.get("user-agent") || "",
        },
      })
      .returning({ id: purchases.id });

    const purchaseId = purchaseRecord.id;

    // Create instant report record with 24-hour expiration using payment service
    const instantReport = await paymentService.createInstantReport({
      userId: localUserId,
      guestSessionId: undefined, // No guest sessions for authenticated purchases
      contractAddress,
      chain,
      purchaseId,
      amount: reportPriceCents,
      expiresInHours: 24,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      purchaseId,
      instantReportId: instantReport.id,
      price: reportPrice,
      credits: reportCredits,
      packageIndex,
      contractAddress,
      chain,
      status: "success",
    });
  } catch (error: any) {
    console.error("Instant report payment error:", error);

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
        error: "Payment creation failed",
        details:
          error.message || "Unknown error occurred while creating payment",
        status: "error",
      },
      { status: 500 }
    );
  }
}
