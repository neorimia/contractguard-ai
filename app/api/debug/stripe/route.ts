/**
 * Stripe Debug Endpoint
 *
 * Simple endpoint to test Stripe configuration and connectivity
 * Only available in development mode
 */

import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe.service";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  try {
    // Test Stripe configuration
    const config = {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + "...",
      nodeEnv: process.env.NODE_ENV,
    };

    // Test Stripe API connectivity
    let stripeTest = null;
    try {
      // Create a direct Stripe instance for testing
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-09-30.clover",
        typescript: true,
      });

      // Try to list customers (this will test API connectivity)
      const customers = await stripe.customers.list({ limit: 1 });
      stripeTest = {
        success: true,
        message: "Stripe API connection successful",
        customerCount: customers.data.length,
      };
    } catch (error) {
      stripeTest = {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error,
      };
    }

    return NextResponse.json({
      config,
      stripeTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
