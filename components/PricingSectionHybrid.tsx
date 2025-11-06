/**
 * Hybrid Pricing Section
 *
 * Jobs-style pricing with three tiers: Free, Instant Credits, and Pro
 */

"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { PriceCard } from "@/components/PriceCard";
import { motion } from "framer-motion";

export default function PricingSectionHybrid() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const user = useUser();
  const router = useRouter();

  // Handle instant purchase
  const handleInstantPurchase = async (packageIndex: number) => {
    // Check if user is authenticated
    if (!user) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    const pkg = PRICING_CONFIG.instant.packages[packageIndex];

    trackEvent(AnalyticsEvents.CHECKOUT_INITIATED, {
      type: "instant",
      packageIndex,
      credits: pkg.credits,
      price: pkg.price,
      source: "pricing_page",
    });

    try {
      setLoadingTier(`instant_${packageIndex}`);

      const response = await fetch("/api/checkout/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageIndex,
          contractAddress: null, // General credits not tied to specific contract
          userEmail: user.primaryEmail, // Pre-fill user email in Stripe
        }),
      });

      const data = await response.json();

      if (data.status === "success" && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Instant checkout error:", error);
      trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
        type: "instant",
        packageIndex,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  // Handle subscription upgrade
  const handleSubscription = async (tier: "starter" | "pro" | "team") => {
    const billingPeriod = "monthly"; // Simplified to monthly-only pricing

    trackEvent(AnalyticsEvents.CHECKOUT_INITIATED, {
      tier,
      billingPeriod,
      userId: user?.id,
      source: "pricing_page",
    });

    if (!user) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    try {
      setLoadingTier(tier);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.status === "error") {
        trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
          tier,
          billingPeriod,
          reason: data.error || "checkout_error",
        });
        alert(data.error || "Failed to create checkout session");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Subscription checkout error:", error);
      trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
        tier,
        billingPeriod,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      alert("An error occurred. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const handleFreeStart = () => {
    router.push("/audit");
  };

  const yearlyDiscount = 20;

  return (
    <section
      id="pricing"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-left space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
            Pricing that fits your{" "}
            <span className="text-zinc-700/80 dark:text-zinc-300/80 font-semibold tracking-tighter">
               needs
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl">
            Start free, pay per scan, or subscribe for unlimited protection.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="relative inline-flex items-center p-1 backdrop-blur-sm border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "text-white dark:text-black"
                  : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                billingPeriod === "yearly"
                  ? "text-white dark:text-black"
                  : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                {yearlyDiscount}% off
              </span>
            </button>

            <motion.div
              className="absolute inset-0 z-0 rounded-lg bg-black dark:bg-white"
              initial={false}
              animate={{
                x: billingPeriod === "monthly" ? 0 : "100%",
                width: "50%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
          </div>
        </div>

        {/* Three Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Tier */}
          <PriceCard
            key={`free`}
            isPopular={PRICING_CONFIG.free.packages[0].popular}
            animationDelay={1 * 0.1}
            credits={PRICING_CONFIG.free.packages[0].credits}
            savings={PRICING_CONFIG.free.packages[0].savings}
            price={PRICING_CONFIG.free.packages[0].price}
            perks={PRICING_CONFIG.free.packages[0].perks}
            buttonText="Start Free"
            onButtonClick={handleFreeStart}
            buttonLoading={loadingTier === `free`}
            buttonDisabled={loadingTier !== null}
          />

          {/* Instant Credits */}
          <PriceCard
            key={`instant-1`}
            isPopular={billingPeriod === "monthly"}
            animationDelay={2 * 0.1}
            credits={PRICING_CONFIG.instant.packages[1].credits}
            price={PRICING_CONFIG.instant.packages[1].price}
            subPrice={{
              value:
                PRICING_CONFIG.instant.packages[1].price /
                PRICING_CONFIG.instant.packages[1].credits, 
              label: "per report",
            }}
            perks={PRICING_CONFIG.instant.packages[1].perks}
            buttonText={user ? "Buy Now" : "Sign in to Buy"}
            buttonLoading={loadingTier === `instant_1`}
            onButtonClick={() => handleInstantPurchase(1)}
            buttonDisabled={loadingTier !== null}
          />

          {/* Pro Tier */}
          <PriceCard
            key="pro"
            isPopular={billingPeriod === "yearly"}
            animationDelay={0}
            title={PRICING_CONFIG.pro.label}
            description="For active traders and pro users"
            price={
              billingPeriod === "monthly"
                ? PRICING_CONFIG.pro.price
                : PRICING_CONFIG.pro.price * 12 * 0.8
            }
            priceLabel={`/${billingPeriod === "monthly" ? "month" : "year"}`}
            saveNote={
              billingPeriod === "yearly"
                ? `Billed annually • Save $${(PRICING_CONFIG.pro.price * 12 * 0.2).toFixed(2)}/year`
                : undefined
            }
            perks={PRICING_CONFIG.pro.perks}
            buttonText={user ? "Subscribe to Pro" : "Sign in to Subscribe"}
            buttonLoading={loadingTier === "pro"}
            onButtonClick={() => handleSubscription("pro")}
            buttonDisabled={loadingTier !== null}
          />
        </div>
      </div>
    </section>
  );
}
