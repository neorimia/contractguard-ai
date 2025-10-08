/**
 * Stripe Customer Portal API
 *
 * Creates a Stripe customer portal session for subscription management
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
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

    // 3. Check if user has a Stripe customer ID
    if (!appUser.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "No subscription found",
          message: "You need to subscribe first",
          status: "error",
        },
        { status: 400 }
      );
    }

    // 4. Get base URL with protocol
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Ensure URL has protocol
    const siteUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    // 5. Create portal session
    const session = await stripeService.createCustomerPortalSession({
      customerId: appUser.stripeCustomerId,
      returnUrl: `${siteUrl}/account`,
    });

    // 6. Return portal URL
    return NextResponse.json({
      url: session.url,
      status: "success",
    });
  } catch (error: any) {
    console.error("Portal session creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create portal session",
        details: error.message,
        status: "error",
      },
      { status: 500 }
    );
  }
}
