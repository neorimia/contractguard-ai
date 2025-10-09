"use client";

import { Check, ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";

// Price tier type definition
type PriceTier = {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const user = useUser();
  const router = useRouter();

  // Pricing data
  const priceTiers: PriceTier[] = [
    {
      name: "Free Tier",
      price: billingPeriod === "monthly" ? "0" : "0",
      description: "Perfect for casual traders and contract exploration",
      features: [
        "3 scans per day",
        "Basic risk analysis",
        "Community support",
        "Plain English explanations",
        "Honeypot detection",
      ],
      cta: "Start scanning",
      popular: false,
    },
    {
      name: "Pro Tier",
      price: billingPeriod === "monthly" ? "29" : "290",
      description: "Unlimited scans with advanced security features",
      features: [
        "Unlimited scans",
        "Advanced analysis",
        "API access (500 calls/day)",
        "Priority processing",
        "Historical analysis",
        "PDF exports",
        "No ads",
        "Email support",
      ],
      cta: "Go Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: billingPeriod === "monthly" ? "199" : "1990",
      description:
        "Advanced features for professional traders and institutions",
      features: [
        "Everything in Pro",
        "Unlimited API calls",
        "White-label option",
        "Custom AI training",
        "Dedicated support",
        "SLA guarantees",
        "Multi-user teams",
        "Custom integrations",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  // Discount percentage for yearly billing
  const yearlyDiscount = 20;

  // Yearly savings message
  const getYearlySavingsText = (price: string) => {
    if (price === "$0") return "";
    const monthlyPrice = Number.parseInt(price.replace("$", ""));
    const yearlySavings = monthlyPrice * 12 * (yearlyDiscount / 100);
    return `Save $${yearlySavings} annually`;
  };

  // Shared transition settings
  const sharedTransition = {
    duration: 0.3,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };

  // Handle upgrade to Pro or Enterprise
  const handleUpgrade = async (tier: "pro" | "enterprise") => {
    // Track checkout initiated
    trackEvent(AnalyticsEvents.CHECKOUT_INITIATED, {
      tier,
      userId: user?.id,
      source: "pricing_page",
    });

    // Check if user is logged in
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

      const data = (await response.json()) as {
        status?: string;
        error?: string;
        url?: string;
      };

      if (data.status === "error") {
        console.error("Checkout error:", data.error);

        // Track checkout failed
        trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
          tier,
          reason: data.error || "checkout_error",
        });

        if (typeof window !== "undefined") {
          window.alert(data.error || "Failed to create checkout session");
        }
        return;
      }

      if (data.url) {
        // Redirect to Stripe checkout
        if (typeof window !== "undefined") {
          window.location.href = data.url;
        }
      } else {
        console.error("No checkout URL returned");
        if (typeof window !== "undefined") {
          window.alert("Failed to create checkout session");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);

      // Track checkout error
      trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
        tier,
        reason: "exception",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (typeof window !== "undefined") {
        window.alert("An error occurred. Please try again.");
      }
    } finally {
      setLoadingTier(null);
    }
  };

  // Handle free tier - redirect to sign up or homepage
  const handleFreeTier = () => {
    if (!user) {
      router.push("/sign-up");
    } else {
      router.push("/");
    }
  };

  // Handle enterprise contact
  const handleEnterpriseContact = () => {
    // TODO: Open contact form modal or redirect to contact page
    if (typeof window !== "undefined") {
      window.location.href =
        "mailto:contact@contractguard.ai?subject=Enterprise Inquiry";
    }
  };

  return (
    <section
      id="pricing"
      className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl overflow-hidden relative"
    >
      {/* Background subtle patterns */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-black/5 dark:bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/5 dark:bg-white/5 blur-3xl" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-10">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black dark:text-white">
            Protect your investments{" "}
            <span className="bg-gradient-to-r from-black to-black/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
              with confidence
            </span>
          </h2>
          <p className="text-base sm:text-lg tracking-tight text-black/60 dark:text-white/60 max-w-2xl mx-auto">
            Choose the plan that fits your trading needs. From casual investors
            to professional traders — transparent pricing, no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="pt-2 flex justify-center">
            <div className="relative inline-flex items-center p-1 backdrop-blur-sm border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "text-white dark:text-black"
                    : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
                aria-pressed={billingPeriod === "monthly"}
              >
                Pay Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  billingPeriod === "yearly"
                    ? "text-white dark:text-black"
                    : "text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
                aria-pressed={billingPeriod === "yearly"}
              >
                Pay Yearly
                <span className="absolute -top-2 -right-2 flex items-center justify-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/5">
                  {yearlyDiscount}% off
                </span>
              </button>

              {/* Slider that moves based on selection */}
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
                style={{
                  x: billingPeriod === "monthly" ? 0 : "100%",
                  width: "50%",
                }}
              />
            </div>
          </div>
        </div>

        {/* Pricing Cards Container */}
        <div className="max-w-[1100px] mx-auto p-4 sm:p-6 rounded-xl relative backdrop-blur-sm border border-dashed border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent" />
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent" />

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {priceTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                }}
                className={`relative rounded-lg overflow-hidden group transition-all duration-300 hover:translate-y-[-1px] hover:rotate-2
                                    ${
                                      tier.popular
                                        ? "backdrop-blur-sm bg-black/[0.03] dark:bg-white/[0.03] border border-dashed border-black/15 dark:border-white/15"
                                        : "backdrop-blur-sm bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5"
                                    }
                                `}
              >
                {/* Card glow effects */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />

                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-5">
                    <div className="px-2 py-0.5 text-[10px] font-medium text-white dark:text-black bg-black dark:bg-white rounded-b">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card content */}
                <div className="p-5 sm:p-6">
                  {/* Tier name and description */}
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-black/70 dark:text-white/70 mb-4">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-semibold text-black dark:text-white">
                        <NumberFlow
                          value={Number(tier.price)}
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

                    {billingPeriod === "yearly" &&
                      tier.name !== "Free Starter" && (
                        <p className="mt-1 text-[10px] text-black/60 dark:text-white/60">
                          Billed annually ({yearlyDiscount}% discount) •{" "}
                          {getYearlySavingsText(tier.price.replace("$", ""))}
                        </p>
                      )}
                  </div>

                  <div className="w-12 h-px border-t border-dashed border-black/10 dark:border-white/10 mb-4" />

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <motion.li
                        key={`${tier.name}-${feature}`}
                        className="flex items-start gap-2"
                        initial={{
                          opacity: 0,
                          x: -5,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay: 0.2 + featureIndex * 0.05,
                          ...sharedTransition,
                        }}
                      >
                        <div className="flex-shrink-0 rounded-full mt-0.5">
                          <Check className="h-3 w-3 text-black dark:text-white" />
                        </div>
                        <span className="text-xs text-black/80 dark:text-white/80">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.div
                    className="mt-auto relative"
                    transition={sharedTransition}
                  >
                    <Button
                      onClick={() => {
                        if (tier.name === "Free Tier") {
                          handleFreeTier();
                        } else if (tier.name === "Pro Tier") {
                          handleUpgrade("pro");
                        } else {
                          handleEnterpriseContact();
                        }
                      }}
                      disabled={loadingTier !== null}
                      className={`w-full h-8 text-sm group relative overflow-hidden ${
                        tier.popular
                          ? "bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                          : "bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loadingTier === tier.name.split(" ")[0].toLowerCase() ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {tier.cta}
                          <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enterprise note */}
        <div className="mt-12 relative">
          <div className="w-1/2 max-w-3xl mx-auto px-6 py-2 rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-black/[0.03] to-black/[0.01] dark:from-white/[0.03] dark:to-white/[0.01] backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-black/20 dark:via-white/20 to-transparent" />
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-black/20 dark:via-white/20 to-transparent" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
              <div className="text-left">
                <p className="text-sm text-black/70 dark:text-white/70 max-w-xl">
                  Need custom security analysis for your organization?
                </p>
              </div>

              <Button
                onClick={handleEnterpriseContact}
                className="relative group h-10 px-6 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center font-medium">
                  Contact our team
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-black/80 to-black dark:from-white/80 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
