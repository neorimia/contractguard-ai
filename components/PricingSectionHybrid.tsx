/**
 * Hybrid Pricing Section
 *
 * Tabbed pricing interface combining instant reports and subscriptions
 */

"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { PriceCard } from "@/components/PriceCard";

export default function PricingSectionHybrid() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"instant" | "subscription">(
    "instant"
  );
  const user = useUser();
  const router = useRouter();

  // Shared transition settings
  const sharedTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

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
  const handleSubscription = async (tier: "pro" | "team") => {
    trackEvent(AnalyticsEvents.CHECKOUT_INITIATED, {
      tier,
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
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.status === "error") {
        trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
          tier,
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
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      alert("An error occurred. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const yearlyDiscount = 20;

  return (
    <section
      id="pricing"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden relative"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-black/5 dark:bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/5 dark:bg-white/5 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-10">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white">
            Choose your{" "}
            <span className="bg-gradient-to-r from-black to-black/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
              protection plan
            </span>
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Pay per scan or subscribe for unlimited access. From one-time audits
            to professional monitoring — transparent pricing, no surprises.
          </p>

          {/* Pricing Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="relative inline-flex items-center p-1 backdrop-blur-sm border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedTab("instant")}
                className={`relative z-10 px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  selectedTab === "instant"
                    ? "text-white dark:text-black"
                    : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
              >
                Instant Reports
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("subscription")}
                className={`relative z-10 px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  selectedTab === "subscription"
                    ? "text-white dark:text-black"
                    : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
              >
                Subscriptions
              </button>

              <motion.div
                className="absolute inset-0 z-0 rounded-lg bg-black dark:bg-white"
                initial={false}
                animate={{
                  x: selectedTab === "instant" ? 0 : "100%",
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

          {/* Instant Reports Section */}
          {selectedTab === "instant" && (
            <div key="instant-content">
              <div className="text-center mb-6">
                <p className="text-sm text-black/60 dark:text-white/60">
                  One-time payment • Credits never expire
                </p>
              </div>

              <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl relative backdrop-blur-sm border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {PRICING_CONFIG.instant.packages.map((pkg, index) => (
                    <PriceCard
                      key={`instant-${index}`}
                      isPopular={pkg.popular}
                      animationDelay={index * 0.1}
                      credits={pkg.credits}
                      savings={pkg.savings}
                      price={pkg.price}
                      subPrice={{
                        value: pkg.price / pkg.credits,
                        label: "per report",
                      }}
                      perks={[
                        "Full AI security audit",
                        "Detailed risk analysis",
                        "Instant delivery",
                        "Never expires",
                      ]}
                      buttonText={user ? "Buy Now" : "Sign in to Buy"}
                      buttonLoading={loadingTier === `instant_${index}`}
                      onButtonClick={() => handleInstantPurchase(index)}
                      buttonDisabled={loadingTier !== null}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Section */}
          {selectedTab === "subscription" && (
            <div key="subscription-content">
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

              <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl relative backdrop-blur-sm border  border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pro Plan */}
                  <PriceCard
                    key="pro"
                    isPopular={true}
                    animationDelay={0}
                    title={PRICING_CONFIG.pro.label}
                    description="For active traders and DeFi users"
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
                    buttonText={
                      user ? "Subscribe to Pro" : "Sign in to Subscribe"
                    }
                    buttonLoading={loadingTier === "pro"}
                    onButtonClick={() => handleSubscription("pro")}
                    buttonDisabled={loadingTier !== null}
                  />

                  {/* Team/API Plan */}
                  <PriceCard
                    key="team"
                    isPopular={false}
                    animationDelay={0.1}
                    title={PRICING_CONFIG.team.label}
                    description="For teams and API integrations"
                    price={
                      billingPeriod === "monthly"
                        ? PRICING_CONFIG.team.price
                        : PRICING_CONFIG.team.price * 12 * 0.8
                    }
                    priceLabel={`/${billingPeriod === "monthly" ? "month" : "year"}`}
                    saveNote={
                      billingPeriod === "yearly"
                        ? `Billed annually • Save $${(PRICING_CONFIG.team.price * 12 * 0.2).toFixed(2)}/year`
                        : undefined
                    }
                    perks={PRICING_CONFIG.team.perks}
                    buttonText={
                      user ? "Subscribe to Team" : "Sign in to Subscribe"
                    }
                    buttonLoading={loadingTier === "team"}
                    onButtonClick={() => handleSubscription("team")}
                    buttonDisabled={loadingTier !== null}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
