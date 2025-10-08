/**
 * Stripe Service
 *
 * Handles all Stripe-related operations including:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Processing webhooks
 * - Customer portal access
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured in environment variables"
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Stripe Product/Price IDs (configure these in .env)
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
  ENTERPRISE_MONTHLY:
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ||
    "price_enterprise_monthly",
};

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        client_reference_id: params.userId,
        metadata: {
          userId: params.userId,
        },
      };

      // If customer already exists, use their ID
      if (params.customerId) {
        sessionParams.customer = params.customerId;
      } else {
        // Create new customer
        sessionParams.customer_email = params.userEmail;
      }

      // Enable customer to update payment method
      sessionParams.customer_update = {
        address: "auto",
      };

      // Allow promo codes
      sessionParams.allow_promotion_codes = true;

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      return session;
    } catch (error) {
      console.error("Stripe checkout session creation failed:", error);
      throw new Error(
        `Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create a customer portal session
   */
  async createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      return session;
    } catch (error) {
      console.error("Stripe portal session creation failed:", error);
      throw new Error(
        `Failed to create portal session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get or create a Stripe customer
   */
  async getOrCreateCustomer(params: {
    email: string;
    userId: string;
    name?: string;
  }): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingCustomers = await this.stripe.customers.list({
        email: params.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: params.email,
        metadata: {
          userId: params.userId,
        },
        name: params.name,
      });

      return customer;
    } catch (error) {
      console.error("Stripe customer creation failed:", error);
      throw new Error(
        `Failed to get or create customer: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Failed to retrieve subscription:", error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        // Cancel immediately
        return await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        // Cancel at period end
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw new Error(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Reactivate a subscription
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      throw new Error(
        `Failed to reactivate subscription: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error(
        `Webhook verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer.deleted ? null : customer;
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
      return null;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.update(customerId, params);
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw new Error(
        `Failed to update customer: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

export const stripeService = new StripeService();
