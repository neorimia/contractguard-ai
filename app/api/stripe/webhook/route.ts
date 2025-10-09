/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events for subscription management
 *
 * Important: This endpoint must have bodyParser disabled to work with Stripe webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe.service";
import { AuthService } from "@/lib/services/auth.service";
import { EmailService } from "@/lib/services/email.service";
import Stripe from "stripe";

const authService = new AuthService();
const emailService = new EmailService();

// Disable body parsing for webhook
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Get raw body
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Construct and verify webhook event
    let event: Stripe.Event;

    try {
      event = stripeService.constructWebhookEvent(body, signature);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log("Checkout session completed:", session.id);

  const userId = session.metadata?.userId || session.client_reference_id;

  if (!userId) {
    console.error("No user ID found in session metadata");
    return;
  }

  // Update user with Stripe customer ID
  if (session.customer && typeof session.customer === "string") {
    await authService.updateUser(parseInt(userId), {
      stripeCustomerId: session.customer,
    });
  }

  // If subscription was created, update user
  if (session.subscription && typeof session.subscription === "string") {
    await authService.updateUser(parseInt(userId), {
      stripeSubscriptionId: session.subscription,
      subscriptionStatus: "active",
    });
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Find user by customer ID
  const user = await authService.getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Determine tier from subscription
  const tier = determineTierFromSubscription(subscription);

  // Update user
  await authService.updateUser(user.id, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    tier,
  });

  console.log(`User ${user.id} upgraded to ${tier}`);

  // Send payment confirmation email for initial subscription
  if (user.email) {
    try {
      console.log(
        `Preparing to send payment confirmation email to ${user.email}`
      );

      const subscriptionData = subscription as any;
      const nextPaymentDate = new Date(
        subscriptionData.current_period_end * 1000
      );

      // Get the latest invoice for this subscription to get amount
      const latestInvoice = subscriptionData.latest_invoice;

      if (!latestInvoice) {
        console.log("No latest invoice found on subscription");
        return;
      }

      const invoiceId =
        typeof latestInvoice === "string" ? latestInvoice : latestInvoice.id;
      console.log(`Fetching invoice: ${invoiceId}`);

      const invoice = await stripeService.getInvoice(invoiceId);

      if (!invoice) {
        console.error(`Failed to retrieve invoice ${invoiceId}`);
        return;
      }

      const amount = (invoice.amount_paid || invoice.total) / 100;
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

      console.log(
        `Sending payment confirmation email for $${amount} to ${user.email}`
      );

      await emailService.sendPaymentConfirmation(user.email, {
        firstName: user.displayName || undefined,
        amount,
        invoiceId: invoice.number || invoiceId,
        tier,
        nextPaymentDate,
        receiptUrl: invoice.hosted_invoice_url || `${siteUrl}/account`,
      });

      console.log(`✅ Payment confirmation email sent to ${user.email}`);
    } catch (error) {
      console.error("❌ Failed to send payment confirmation email:", error);
    }
  } else {
    console.log(`No email address for user ${user.id}`);
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  // Find user by subscription ID
  const user = await authService.getUserBySubscriptionId(subscription.id);

  if (!user) {
    console.error("User not found for subscription:", subscription.id);
    return;
  }

  // Determine tier
  const tier =
    subscription.status === "active" || subscription.status === "trialing"
      ? determineTierFromSubscription(subscription)
      : "free";

  // Update user
  await authService.updateUser(user.id, {
    subscriptionStatus: subscription.status,
    tier,
  });

  console.log(
    `User ${user.id} subscription updated: ${subscription.status}, tier: ${tier}`
  );
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  // Find user by subscription ID
  const user = await authService.getUserBySubscriptionId(subscription.id);

  if (!user) {
    console.error("User not found for subscription:", subscription.id);
    return;
  }

  // Calculate access end date (end of current billing period)
  const subscriptionData = subscription as any;
  const accessEndDate = subscriptionData.current_period_end
    ? new Date(subscriptionData.current_period_end * 1000)
    : new Date();

  // Downgrade user to free tier
  await authService.updateUser(user.id, {
    tier: "free",
    subscriptionStatus: "canceled",
    stripeSubscriptionId: null,
  });

  console.log(`User ${user.id} downgraded to free tier`);

  // Send cancellation email
  if (user.email) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

    await emailService.sendCancellationEmail(user.email, {
      firstName: user.displayName || undefined,
      tier: user.tier,
      accessEndDate,
      reactivateUrl: `${siteUrl}/pricing`,
      feedbackUrl: `${siteUrl}/feedback?reason=cancellation`,
    });
  }
}

/**
 * Handle successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  // Access subscription property safely
  const subscription = (invoice as any).subscription;

  if (!subscription) {
    return;
  }

  const subscriptionId =
    typeof subscription === "string" ? subscription : subscription.id;

  // Find user by subscription ID
  const user = await authService.getUserBySubscriptionId(subscriptionId);

  if (!user) {
    console.error("User not found for subscription:", subscriptionId);
    return;
  }

  // Ensure subscription is active
  await authService.updateUser(user.id, {
    subscriptionStatus: "active",
  });

  console.log(`Payment succeeded for user ${user.id}`);

  // Send payment confirmation email (skip first invoice as it's sent on subscription creation)
  if (user.email && invoice.billing_reason !== "subscription_create") {
    // Get subscription details to determine next payment date
    const stripeSubscription =
      await stripeService.getSubscription(subscriptionId);

    if (stripeSubscription) {
      const subscriptionData = stripeSubscription as any;
      const nextPaymentDate = new Date(
        subscriptionData.current_period_end * 1000
      );
      const amount = invoice.amount_paid / 100; // Convert from cents

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

      await emailService.sendPaymentConfirmation(user.email, {
        firstName: user.displayName || undefined,
        amount,
        invoiceId: invoice.number || invoice.id,
        tier: user.tier,
        nextPaymentDate,
        receiptUrl: invoice.hosted_invoice_url || `${siteUrl}/account`,
      });
    }
  }
}

/**
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Invoice payment failed:", invoice.id);

  // Access subscription property safely
  const subscription = (invoice as any).subscription;

  if (!subscription) {
    return;
  }

  const subscriptionId =
    typeof subscription === "string" ? subscription : subscription.id;

  // Find user by subscription ID
  const user = await authService.getUserBySubscriptionId(subscriptionId);

  if (!user) {
    console.error("User not found for subscription:", subscriptionId);
    return;
  }

  // Update subscription status
  await authService.updateUser(user.id, {
    subscriptionStatus: "past_due",
  });

  console.log(
    `Payment failed for user ${user.id}, subscription marked as past_due`
  );

  // Send payment failed notification
  if (user.email) {
    const amount = invoice.amount_due / 100; // Convert from cents
    const failureReason =
      invoice.last_finalization_error?.message ||
      "Your payment method was declined";

    // Next retry attempt (Stripe typically retries in 3-5 days)
    const nextAttemptDate = new Date();
    nextAttemptDate.setDate(nextAttemptDate.getDate() + 3);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

    await emailService.sendPaymentFailedNotification(user.email, {
      firstName: user.displayName || undefined,
      amount,
      failureReason,
      nextAttemptDate,
      updatePaymentUrl: `${siteUrl}/account#billing`,
    });
  }
}

/**
 * Determine tier from Stripe subscription
 */
function determineTierFromSubscription(
  subscription: Stripe.Subscription
): "free" | "pro" | "enterprise" {
  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    return "free";
  }

  // Map price IDs to tiers
  const proPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const enterprisePriceId = process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID;

  if (priceId === enterprisePriceId) {
    return "enterprise";
  } else if (priceId === proPriceId) {
    return "pro";
  }

  return "free";
}
