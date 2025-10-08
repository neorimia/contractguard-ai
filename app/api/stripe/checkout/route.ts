/**
 * Stripe Checkout API
 *
 * Creates a Stripe checkout session for subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService, STRIPE_PRICES } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";

const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const stackUser = await stackServerApp.getUser();

    if (!stackUser || !stackUser.primaryEmail) {
      return NextResponse.json(
        { error: "Unauthorized", status: "error" },
        { status: 401 }
      );
    }

    // 2. Get app user
    const appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      return NextResponse.json(
        { error: "User not found", status: "error" },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const { priceId, tier } = await req.json();

    // Validate tier
    if (!["pro", "enterprise"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier", status: "error" },
        { status: 400 }
      );
    }

    // Map tier to price ID
    const stripePriceId =
      tier === "pro"
        ? priceId || STRIPE_PRICES.PRO_MONTHLY
        : priceId || STRIPE_PRICES.ENTERPRISE_MONTHLY;

    // 4. Get or create Stripe customer
    const customer = await stripeService.getOrCreateCustomer({
      email: stackUser.primaryEmail,
      userId: appUser.id.toString(),
      name: stackUser.displayName || undefined,
    });

    // 5. Update user with Stripe customer ID if not already set
    if (!appUser.stripeCustomerId) {
      await authService.updateUser(appUser.id, {
        stripeCustomerId: customer.id,
      });
    }

    // 6. Get base URL with protocol
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Ensure URL has protocol
    const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    // 7. Create checkout session
    const session = await stripeService.createCheckoutSession({
      priceId: stripePriceId,
      userId: appUser.id.toString(),
      userEmail: stackUser.primaryEmail,
      customerId: customer.id,
      successUrl: `${siteUrl}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancelUrl: `${siteUrl}/pricing?canceled=true`,
    });

    // 8. Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      status: "success",
    });
  } catch (error: any) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
        status: "error",
      },
      { status: 500 }
    );
  }
}
