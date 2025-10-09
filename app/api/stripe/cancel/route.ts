/**
 * POST /api/stripe/cancel
 *
 * Cancel user's subscription (at period end or immediately)
 * with optional feedback collection
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";
import { db } from "@/db";
import { feedback } from "@/db/schema";
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
        { status: "error", error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      immediately = false,
      reason,
      feedback: userFeedback,
    } = body as {
      immediately?: boolean;
      reason?: string;
      feedback?: string;
    };

    // Cancel subscription via Stripe
    const subscription = await stripeService.cancelSubscription(
      dbUser.stripeSubscriptionId,
      immediately
    );

    // Store cancellation feedback if provided
    if (reason || userFeedback) {
      await db.insert(feedback).values({
        userId: dbUser.id,
        reason: "cancellation",
        feedback: userFeedback || reason || "No reason provided",
      });
    }

    // Track cancellation event
    trackEvent("subscription_canceled", {
      userId: dbUser.id,
      tier: dbUser.tier,
      immediately,
      reason: reason || "not_provided",
    });

    // Format response (cast to any for snake_case properties)
    const subscriptionData = subscription as any;
    const response = {
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        currentPeriodEnd: new Date(
          subscriptionData.current_period_end * 1000
        ).toISOString(),
      },
    };

    return NextResponse.json({
      status: "success",
      data: response,
    });
  } catch (error: any) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to cancel subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
