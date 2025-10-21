"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  TrendingUp,
  Shield,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Loader2,
  Star,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SummaryReportData } from "@/lib/types/report-types";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

interface ReportUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SummaryReportData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type SelectedOption = "instant" | "subscription" | null;

export function ReportUpgradeModal({
  open,
  onOpenChange,
  data,
  onSuccess,
  onError,
}: ReportUpgradeModalProps) {
  const user = useUser();
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [selectedInstantPackage, setSelectedInstantPackage] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<
    "pro" | "team"
  >("pro");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOption(null);
      onOpenChange(false);
    }
  };

  const handleInstantPurchase = async () => {
    // Check if user is authenticated
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);

    try {
      const selectedPkg =
        PRICING_CONFIG.instant.packages[selectedInstantPackage];

      if (!selectedPkg) {
        throw new Error("Invalid package selected");
      }

      const response = await fetch("/api/checkout/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: data.contractAddress,
          chain: data.chain,
          packageIndex: selectedInstantPackage,
          credits: selectedPkg.credits,
          price: selectedPkg.price,
          stripePriceId: selectedPkg.stripePriceId,
          userEmail: user?.primaryEmail, // Pre-fill user email in Stripe
        }),
      });

      const result = await response.json();

      if (result.status === "success" && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Instant purchase error:", error);
      onError?.(error instanceof Error ? error.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  const handleSubscriptionUpgrade = async () => {
    // Check if user is authenticated
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);

    try {
      const plan = PRICING_CONFIG[selectedSubscription];

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          tier: selectedSubscription,
        }),
      });

      const result = await response.json();

      if (result.status === "success" && result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Subscription upgrade error:", error);
      onError?.(error instanceof Error ? error.message : "Checkout failed");
      setIsLoading(false);
    }
  };

  const instantPriceOptions = PRICING_CONFIG.instant.packages;
  const proPlan = PRICING_CONFIG.pro;
  const teamPlan = PRICING_CONFIG.team;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-black border-white/20">
        <AnimatePresence mode="wait">
          {!selectedOption ? (
            // Initial selection screen
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="text-center mb-8">
                <DialogTitle className="text-3xl font-bold mb-2 text-white">
                  Unlock Full Security Analysis
                </DialogTitle>
                <DialogDescription className="text-lg text-white/70">
                  Choose how you'd like to access the complete report for{" "}
                  <code className="bg-black/30 border border-white/20 px-2 py-1 rounded text-sm text-white">
                    {data.contractAddress.slice(0, 6)}...
                    {data.contractAddress.slice(-4)}
                  </code>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instant Report Option */}
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <div
                    className="p-6 rounded-xl border-2 border-white/30 bg-gradient-to-br from-black/40 to-black/20 cursor-pointer hover:border-white/50 transition-all"
                    onClick={() => {
                      if (!user) {
                        router.push("/sign-in");
                        return;
                      }
                      setSelectedOption("instant");
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Zap className="h-6 w-6 text-black" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Instant Report
                          </h3>
                          <p className="text-white/70">One-time access</p>
                        </div>
                      </div>
                      <Badge className="bg-white text-black">Popular</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-white">
                        ${instantPriceOptions[1].price}
                        <span className="text-sm font-normal text-white/70 ml-1">
                          for {instantPriceOptions[1].credits} reports
                        </span>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          Full security analysis
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          All {data.totalIssuesCount} issues detailed
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          24-hour access
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          No subscription required
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button
                        className="w-full bg-white hover:bg-white/90 text-black border border-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            router.push("/sign-in");
                            return;
                          }
                          setSelectedOption("instant");
                        }}
                      >
                        {user ? "Get Instant Access" : "Sign in to Purchase"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Subscription Option */}
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <div
                    className="p-6 rounded-xl border-2 border-white/20 bg-gradient-to-br from-black/30 to-black/10 cursor-pointer hover:border-white/40 transition-all"
                    onClick={() => {
                      if (!user) {
                        router.push("/sign-in");
                        return;
                      }
                      setSelectedOption("subscription");
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-lg border border-white/20">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            Pro Subscription
                          </h3>
                          <p className="text-white/70">Unlimited access</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/30 text-white bg-black/50"
                      >
                        Best Value
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-white">
                        ${proPlan.price}
                        <span className="text-sm font-normal text-white/70 ml-1">
                          /month
                        </span>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          Unlimited contract scans
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          Advanced risk scoring
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          Email alerts & monitoring
                        </li>
                        <li className="flex items-center gap-2 text-white/80">
                          <CheckCircle className="h-4 w-4 text-white" />
                          Priority support
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full bg-white hover:bg-white/90 text-black border border-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) {
                            router.push("/sign-in");
                            return;
                          }
                          setSelectedOption("subscription");
                        }}
                      >
                        {user ? "Upgrade to Pro" : "Sign in for Pro"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Trust signals */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-8 w-8 text-white" />
                    <span className="text-sm font-medium text-white/80">
                      Secure Payment
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 text-white" />
                    <span className="text-sm font-medium text-white/80">
                      Instant Access
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-white" />
                    <span className="text-sm font-medium text-white/80">
                      Money Back Guarantee
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : selectedOption === "instant" ? (
            // Instant purchase selection
            <motion.div
              key="instant"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  disabled={isLoading}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Choose Instant Report Package
                  </h2>
                  <p className="text-white/70">
                    One-time purchase, no subscription
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {instantPriceOptions.map((pkg, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedInstantPackage === index
                        ? "border-white bg-white/10 shadow-lg"
                        : "border-white/20 hover:border-white/40 bg-black/20"
                    }`}
                    onClick={() => setSelectedInstantPackage(index)}
                  >
                    {pkg.popular && (
                      <Badge className="mb-2 bg-white text-black">
                        Most Popular
                      </Badge>
                    )}
                    {pkg.savings && (
                      <Badge
                        variant="outline"
                        className="mb-2 border-white/30 text-white bg-black/50"
                      >
                        {pkg.savings}
                      </Badge>
                    )}

                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1 text-white">
                        {pkg.credits}
                      </div>
                      <div className="text-sm text-white/70 mb-3">
                        {pkg.credits === 1 ? "Report" : "Reports"}
                      </div>
                      <div className="text-xl font-bold text-white mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-sm text-white/60">
                        ${(pkg.price / pkg.credits).toFixed(2)} per report
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleInstantPurchase}
                  disabled={isLoading || !user}
                  className="w-full bg-white hover:bg-white/90 text-black border border-white/20"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase $
                      {instantPriceOptions[selectedInstantPackage].price}{" "}
                      Instant Report
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-white/60">
                  Credits never expire. Use them anytime for future reports.
                </p>
              </div>
            </motion.div>
          ) : (
            // Subscription selection
            <motion.div
              key="subscription"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  disabled={isLoading}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Choose Subscription Plan
                  </h2>
                  <p className="text-white/70">
                    Unlimited access with monthly billing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[proPlan, teamPlan].map((plan, index) => {
                  const isSelected =
                    selectedSubscription === plan.id.split("_")[0];
                  const planKey = plan.id.split("_")[0] as "pro" | "team";

                  return (
                    <div
                      key={plan.id}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-white bg-white/10 shadow-lg"
                          : "border-white/20 hover:border-white/40 bg-black/20"
                      }`}
                      onClick={() => setSelectedSubscription(planKey)}
                    >
                      {planKey === "pro" && (
                        <Badge className="mb-3 bg-white text-black">
                          Recommended
                        </Badge>
                      )}

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white">
                          {plan.label}
                        </h3>
                        <div className="text-3xl font-bold text-white">
                          ${plan.price}
                          <span className="text-sm font-normal text-white/70 ml-1">
                            /{plan.interval}
                          </span>
                        </div>

                        <ul className="space-y-2 text-sm">
                          {plan.perks.slice(0, 4).map((perk, perkIndex) => (
                            <li
                              key={perkIndex}
                              className="flex items-center gap-2 text-white/80"
                            >
                              <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
                              <span>{perk}</span>
                            </li>
                          ))}
                          {plan.perks.length > 4 && (
                            <li className="text-xs text-white/60 pl-6">
                              +{plan.perks.length - 4} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleSubscriptionUpgrade}
                disabled={isLoading}
                className="w-full bg-white hover:bg-white/90 text-black border border-white/20"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {user
                      ? `Upgrade to ${PRICING_CONFIG[selectedSubscription].label}`
                      : "Sign in to upgrade"}
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-white/60 mt-3">
                Cancel anytime. 30-day money-back guarantee.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
