/**
 * GET /api/user/billing
 *
 * Fetch comprehensive billing information for authenticated user
 * Including subscription details, payment methods, and customer info
 */

import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { stripeService } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";

const authService = new AuthService();

export async function GET(req: NextRequest) {
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
    if (!dbUser) {
      return NextResponse.json(
        { status: "error", error: "User not found in database" },
        { status: 404 }
      );
    }

    // If no Stripe customer, return minimal data
    if (!dbUser.stripeCustomerId) {
      return NextResponse.json({
        status: "success",
        data: {
          subscription: null,
          paymentMethod: null,
          customer: null,
          tier: dbUser.tier,
        },
      });
    }

    // Fetch billing data from Stripe in parallel
    const [customer, subscription, paymentMethods] = await Promise.all([
      stripeService.getCustomer(dbUser.stripeCustomerId),
      dbUser.stripeSubscriptionId
        ? stripeService.getSubscription(dbUser.stripeSubscriptionId)
        : Promise.resolve(null),
      stripeService.getPaymentMethods(dbUser.stripeCustomerId),
    ]);

    // Format subscription data (cast to any for snake_case properties)
    const subscriptionData = subscription
      ? (() => {
          const sub = subscription as any;

          // Helper function to safely convert timestamp to ISO string
          const toISOStringOrNull = (
            timestamp: number | null | undefined
          ): string | null => {
            if (
              !timestamp ||
              typeof timestamp !== "number" ||
              isNaN(timestamp)
            ) {
              return null;
            }
            try {
              const date = new Date(timestamp * 1000);
              // Check if date is valid
              if (isNaN(date.getTime())) {
                return null;
              }
              return date.toISOString();
            } catch (error) {
              console.error("Error converting timestamp to ISO string:", error);
              return null;
            }
          };

          return {
            id: subscription.id,
            status: subscription.status,
            tier: dbUser.tier,
            currentPeriodStart: toISOStringOrNull(sub.current_period_start),
            currentPeriodEnd: toISOStringOrNull(sub.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: toISOStringOrNull(subscription.canceled_at),
            trialEnd: toISOStringOrNull(sub.trial_end),
            priceId: subscription.items.data[0]?.price.id || "",
            amount: subscription.items.data[0]?.price.unit_amount || 0,
            currency: subscription.items.data[0]?.price.currency || "usd",
            interval:
              subscription.items.data[0]?.price.recurring?.interval || "month",
          };
        })()
      : null;

    // Format payment method data
    const paymentMethodData =
      paymentMethods.length > 0
        ? {
            id: paymentMethods[0].id,
            type: paymentMethods[0].type,
            card: {
              brand: paymentMethods[0].card?.brand || "unknown",
              last4: paymentMethods[0].card?.last4 || "0000",
              expMonth: paymentMethods[0].card?.exp_month || 0,
              expYear: paymentMethods[0].card?.exp_year || 0,
            },
          }
        : null;

    // Format customer data
    const customerData = customer
      ? {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          balance: customer.balance || 0,
        }
      : null;

    return NextResponse.json({
      status: "success",
      data: {
        subscription: subscriptionData,
        paymentMethod: paymentMethodData,
        customer: customerData,
        tier: dbUser.tier,
      },
    });
  } catch (error: any) {
    console.error("Billing fetch error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch billing data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
