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
  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [selectedInstantPackage, setSelectedInstantPackage] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<
    "pro" | "team"
  >("pro");
  const [isLoading, setIsLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOption(null);
      setGuestEmail("");
      setShowEmailInput(false);
      onOpenChange(false);
    }
  };

  const handleInstantPurchase = async () => {
    setIsLoading(true);

    try {
      const selectedPkg =
        PRICING_CONFIG.instant.packages[selectedInstantPackage];

      const response = await fetch("/api/payments/instant-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: data.contractAddress,
          chain: data.chain,
          guestEmail: guestEmail || undefined,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
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
                <DialogTitle className="text-3xl font-bold mb-2">
                  Unlock Full Security Analysis
                </DialogTitle>
                <DialogDescription className="text-lg">
                  Choose how you'd like to access the complete report for{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {data.contractAddress.slice(0, 6)}...
                    {data.contractAddress.slice(-4)}
                  </code>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instant Report Option */}
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <div
                    className="p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:border-blue-300 transition-all"
                    onClick={() => setSelectedOption("instant")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900">
                            Instant Report
                          </h3>
                          <p className="text-blue-700">One-time access</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white">Popular</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-blue-900">
                        ${instantPriceOptions[1].price}
                        <span className="text-sm font-normal text-blue-700 ml-1">
                          for {instantPriceOptions[1].credits} reports
                        </span>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Full security analysis
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          All {data.totalIssuesCount} issues detailed
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          24-hour access
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          No subscription required
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption("instant");
                        }}
                      >
                        Get Instant Access
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Subscription Option */}
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  <div
                    className="p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:border-purple-300 transition-all"
                    onClick={() => setSelectedOption("subscription")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-purple-900">
                            Pro Subscription
                          </h3>
                          <p className="text-purple-700">Unlimited access</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-purple-600 text-purple-600"
                      >
                        Best Value
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-purple-900">
                        ${proPlan.price}
                        <span className="text-sm font-normal text-purple-700 ml-1">
                          /month
                        </span>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Unlimited contract scans
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Advanced risk scoring
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Email alerts & monitoring
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Priority support
                        </li>
                      </ul>
                    </div>

                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOption("subscription");
                        }}
                      >
                        Upgrade to Pro
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Trust signals */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium">Instant Access</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                    <span className="text-sm font-medium">
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
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">
                    Choose Instant Report Package
                  </h2>
                  <p className="text-gray-600">
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
                        ? "border-blue-600 bg-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedInstantPackage(index)}
                  >
                    {pkg.popular && (
                      <Badge className="mb-2 bg-blue-600 text-white">
                        Most Popular
                      </Badge>
                    )}
                    {pkg.savings && (
                      <Badge
                        variant="outline"
                        className="mb-2 border-green-500 text-green-700"
                      >
                        {pkg.savings}
                      </Badge>
                    )}

                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {pkg.credits}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {pkg.credits === 1 ? "Report" : "Reports"}
                      </div>
                      <div className="text-xl font-bold text-blue-600 mb-1">
                        ${pkg.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${(pkg.price / pkg.credits).toFixed(2)} per report
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email (optional - for receipt)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleInstantPurchase}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

                <p className="text-xs text-center text-gray-500">
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
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">
                    Choose Subscription Plan
                  </h2>
                  <p className="text-gray-600">
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
                          ? "border-purple-600 bg-purple-50 shadow-lg"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedSubscription(planKey)}
                    >
                      {planKey === "pro" && (
                        <Badge className="mb-3 bg-blue-600 text-white">
                          Recommended
                        </Badge>
                      )}

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold">{plan.label}</h3>
                        <div className="text-3xl font-bold text-purple-600">
                          ${plan.price}
                          <span className="text-sm font-normal text-gray-600 ml-1">
                            /{plan.interval}
                          </span>
                        </div>

                        <ul className="space-y-2 text-sm">
                          {plan.perks.slice(0, 4).map((perk, perkIndex) => (
                            <li
                              key={perkIndex}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{perk}</span>
                            </li>
                          ))}
                          {plan.perks.length > 4 && (
                            <li className="text-xs text-gray-500 pl-6">
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                    Upgrade to {PRICING_CONFIG[selectedSubscription].label}
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-gray-500 mt-3">
                Cancel anytime. 30-day money-back guarantee.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
