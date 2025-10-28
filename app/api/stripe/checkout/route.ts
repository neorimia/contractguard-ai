/**
 * Stripe Checkout API
 *
 * Creates a Stripe checkout session for subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService, STRIPE_PRICES } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";
import {
  getSubscriptionPlan,
  isValidSubscriptionTier,
} from "@/lib/config/pricing";

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

    // 2. Get or sync app user
    let appUser = await authService.getUserByStackId(stackUser.id);

    if (!appUser) {
      // User doesn't exist in our database yet - sync them
      console.log("Syncing new user from Stack Auth:", {
        stackUserId: stackUser.id,
        email: stackUser.primaryEmail,
      });

      appUser = await authService.syncUser(
        stackUser.id,
        stackUser.primaryEmail,
        {
          displayName: stackUser.displayName || undefined,
          avatarUrl: undefined, // Stack Auth doesn't provide avatarUrl in this context
        }
      );
    }

    // 3. Parse request body
    const { priceId, tier, billingPeriod = "monthly" } = await req.json();

    // Validate tier - support both 'enterprise' and 'team'
    const normalizedTier = tier === "enterprise" ? "team" : tier;

    if (!isValidSubscriptionTier(normalizedTier)) {
      return NextResponse.json(
        { error: "Invalid tier", status: "error" },
        { status: 400 }
      );
    }

    // Validate billing period
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing period", status: "error" },
        { status: 400 }
      );
    }

    // Get pricing config
    const pricingPlan = getSubscriptionPlan(normalizedTier);
    if (!pricingPlan) {
      return NextResponse.json(
        { error: "Invalid pricing plan", status: "error" },
        { status: 400 }
      );
    }
    console.log("pricingPlan", pricingPlan);

    // Map tier to price ID based on billing period
    let stripePriceId: string;
    if (billingPeriod === "yearly" && (pricingPlan as any).stripePriceIdYearly) {
      stripePriceId = (pricingPlan as any).stripePriceIdYearly;
    } else {
      stripePriceId = priceId || pricingPlan.stripePriceId;
    }

    // Validate price ID is not empty
    if (!stripePriceId || stripePriceId.trim() === "") {
      const missingEnvVar =
        billingPeriod === "yearly"
          ? `STRIPE_PRICE_${normalizedTier.toUpperCase()}_YEARLY`
          : `STRIPE_PRICE_${normalizedTier.toUpperCase()}_MONTHLY`;

      return NextResponse.json(
        {
          error: "Subscription not configured",
          details: `The ${normalizedTier} ${billingPeriod} plan is not properly configured. Please contact support.`,
          missingEnvVar,
          status: "error",
        },
        { status: 500 }
      );
    }

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
