/**
 * POST /api/stripe/reactivate
 *
 * Reactivate a subscription scheduled for cancellation
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";
import { trackEvent } from "@/lib/analytics/posthog";

const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { status: "error", error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await authService.getUserByStackUserId(user.id);
    if (!dbUser || !dbUser.stripeSubscriptionId) {
      return NextResponse.json(
        { status: "error", error: "No subscription found" },
        { status: 404 }
      );
    }

    // Check if subscription is scheduled for cancellation
    const currentSub = await stripeService.getSubscription(
      dbUser.stripeSubscriptionId
    );
    if (!currentSub?.cancel_at_period_end) {
      return NextResponse.json(
        {
          status: "error",
          error: "Subscription is not scheduled for cancellation",
        },
        { status: 400 }
      );
    }

    // Reactivate subscription
    const subscription = await stripeService.reactivateSubscription(
      dbUser.stripeSubscriptionId
    );

    // Track reactivation event
    trackEvent("subscription_reactivated", {
      userId: dbUser.id,
      tier: dbUser.tier,
    });

    // Format response
    const response = {
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: false,
        status: subscription.status,
      },
    };

    return NextResponse.json({
      status: "success",
      data: response,
    });
  } catch (error: any) {
    console.error("Reactivation error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to reactivate subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}