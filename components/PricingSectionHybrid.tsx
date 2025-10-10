/**
 * Hybrid Pricing Section
 *
 * Tabbed pricing interface combining instant reports and subscriptions
 */

"use client";

import { Check, ArrowRight, Loader2, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { PRICING_CONFIG } from "@/lib/config/pricing";

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

      const guestSessionId = localStorage.getItem("guestSessionId");

      const response = await fetch("/api/checkout/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageIndex,
          contractAddress: null, // Not tied to specific contract
          guestSessionId,
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
            Pay per scan or subscribe for unlimited access. From one-time audits to
            professional monitoring — transparent pricing, no surprises.
          </p>

          {/* Tab Navigation */}
          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as "instant" | "subscription")}
            className="w-full"
          >
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex p-1 backdrop-blur-sm border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
                <TabsTrigger
                  value="instant"
                  className="px-6 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Instant Reports
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="px-6 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Subscriptions
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Instant Reports Tab */}
            <TabsContent value="instant" className="mt-0">
              <div className="text-center mb-6">
                <p className="text-sm text-black/60 dark:text-white/60">
                  One-time payment • No signup required • Credits never expire
                </p>
              </div>

              <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl relative backdrop-blur-sm border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {PRICING_CONFIG.instant.packages.map((pkg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                      }}
                      className={`relative rounded-lg overflow-hidden group transition-all duration-300 hover:translate-y-[-1px] ${
                        pkg.popular
                          ? "backdrop-blur-sm bg-blue-500/5 dark:bg-blue-400/5 border-2 border-blue-500/30 dark:border-blue-400/30"
                          : "backdrop-blur-sm bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5"
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-5">
                          <div className="px-2 py-0.5 text-[10px] font-medium text-white bg-blue-600 rounded-b">
                            Most Popular
                          </div>
                        </div>
                      )}

                      <div className="p-5 sm:p-6">
                        <div className="text-center mb-4">
                          <div className="text-4xl font-bold mb-1">
                            {pkg.credits}
                          </div>
                          <div className="text-sm text-black/60 dark:text-white/60">
                            {pkg.credits === 1 ? "Report" : "Reports"}
                          </div>
                          {pkg.savings && (
                            <Badge
                              variant="outline"
                              className="mt-2 bg-green-50 text-green-700 border-green-300"
                            >
                              {pkg.savings}
                            </Badge>
                          )}
                        </div>

                        <div className="text-center mb-4">
                          <div className="text-3xl font-semibold text-black dark:text-white">
                            ${pkg.price}
                          </div>
                          <div className="text-xs text-black/60 dark:text-white/60 mt-1">
                            ${(pkg.price / pkg.credits).toFixed(2)} per report
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 text-xs text-black/70 dark:text-white/70">
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Full AI security audit</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Detailed risk analysis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Instant delivery</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Never expires</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleInstantPurchase(index)}
                          disabled={loadingTier !== null}
                          className={`w-full h-9 text-sm ${
                            pkg.popular
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10"
                          }`}
                        >
                          {loadingTier === `instant_${index}` ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Buy Now
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscription" className="mt-0">
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

              <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-xl relative backdrop-blur-sm border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pro Plan */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative rounded-lg overflow-hidden backdrop-blur-sm bg-black/[0.03] dark:bg-white/[0.03] border border-dashed border-black/15 dark:border-white/15"
                  >
                    <div className="absolute top-0 right-5">
                      <div className="px-2 py-0.5 text-[10px] font-medium text-white dark:text-black bg-black dark:bg-white rounded-b">
                        Most Popular
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                        {PRICING_CONFIG.pro.label}
                      </h3>
                      <p className="text-xs text-black/70 dark:text-white/70 mb-4">
                        For active traders and DeFi users
                      </p>

                      <div className="mb-5">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-semibold text-black dark:text-white">
                            <NumberFlow
                              value={
                                billingPeriod === "monthly"
                                  ? PRICING_CONFIG.pro.price
                                  : PRICING_CONFIG.pro.price * 12 * 0.8
                              }
                              format={{
                                style: "currency",
                                currency: "USD",
                              }}
                            />
                          </span>
                          <span className="ml-1 text-xs text-black/70 dark:text-white/70">
                            /{billingPeriod === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && (
                          <p className="mt-1 text-[10px] text-black/60 dark:text-white/60">
                            Billed annually • Save $
                            {PRICING_CONFIG.pro.price * 12 * 0.2}/year
                          </p>
                        )}
                      </div>

                      <ul className="space-y-2 mb-6">
                        {PRICING_CONFIG.pro.perks.map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-3 w-3 text-black dark:text-white mt-0.5" />
                            <span className="text-xs text-black/80 dark:text-white/80">
                              {perk}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscription("pro")}
                        disabled={loadingTier !== null}
                        className="w-full h-9 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                      >
                        {loadingTier === "pro" ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Subscribe to Pro
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>

                  {/* Team/API Plan */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="relative rounded-lg overflow-hidden backdrop-blur-sm bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                        {PRICING_CONFIG.team.label}
                      </h3>
                      <p className="text-xs text-black/70 dark:text-white/70 mb-4">
                        For teams and API integrations
                      </p>

                      <div className="mb-5">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-semibold text-black dark:text-white">
                            <NumberFlow
                              value={
                                billingPeriod === "monthly"
                                  ? PRICING_CONFIG.team.price
                                  : PRICING_CONFIG.team.price * 12 * 0.8
                              }
                              format={{
                                style: "currency",
                                currency: "USD",
                              }}
                            />
                          </span>
                          <span className="ml-1 text-xs text-black/70 dark:text-white/70">
                            /{billingPeriod === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && (
                          <p className="mt-1 text-[10px] text-black/60 dark:text-white/60">
                            Billed annually • Save $
                            {PRICING_CONFIG.team.price * 12 * 0.2}/year
                          </p>
                        )}
                      </div>

                      <ul className="space-y-2 mb-6">
                        {PRICING_CONFIG.team.perks.map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-3 w-3 text-black dark:text-white mt-0.5" />
                            <span className="text-xs text-black/80 dark:text-white/80">
                              {perk}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscription("team")}
                        disabled={loadingTier !== null}
                        className="w-full h-9 text-sm bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10"
                      >
                        {loadingTier === "team" ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Subscribe to Team
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}