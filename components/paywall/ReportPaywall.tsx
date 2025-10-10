/**
 * CarVertical-Style Paywall Component
 *
 * Shows preview of report with blurred content and instant purchase options
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Shield, Zap, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { useHasAccess } from "@/lib/hooks/useHasAccess";

interface ReportPaywallProps {
  contractAddress: string;
  riskScore?: number;
  issueCount?: number;
  children: React.ReactNode;
}

export function ReportPaywall({
  contractAddress,
  riskScore,
  issueCount,
  children,
}: ReportPaywallProps) {
  const router = useRouter();
  const { hasAccess, accessType, scansRemaining, isLoading } = useHasAccess();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(1); // Default to 3-pack (index 1)
  const [guestEmail, setGuestEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Show paywall if no access
  const shouldShowPaywall = !isLoading && !hasAccess;

  const handlePurchase = async () => {
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageIndex: selectedPackage,
          contractAddress,
          guestEmail: guestEmail || undefined,
        }),
      });

      const data = await response.json();

      if (data.status === "success" && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      {/* Report Content - blurred if no access */}
      <div className={shouldShowPaywall ? "relative" : ""}>
        {/* 30% Preview Content */}
        {shouldShowPaywall && (
          <div className="mb-8 p-6 bg-white rounded-lg border-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report Preview</h3>
              <Badge variant="outline" className="text-sm">
                Limited Preview
              </Badge>
            </div>

            {riskScore !== undefined && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span
                    className={`text-2xl font-bold ${
                      riskScore >= 70
                        ? "text-red-600"
                        : riskScore >= 40
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {riskScore}/100
                  </span>
                </div>
              </div>
            )}

            {issueCount !== undefined && (
              <div>
                <span className="text-sm text-gray-600">Issues Detected: </span>
                <span className="text-lg font-semibold text-red-600">
                  {issueCount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Blurred Content */}
        {shouldShowPaywall ? (
          <div className="relative">
            <div className="filter blur-sm pointer-events-none select-none">
              {children}
            </div>

            {/* Unlock Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white via-white/80 to-transparent">
              <div className="text-center p-8 bg-white rounded-xl shadow-2xl max-w-md mx-auto">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Full Report Locked</h3>
                <p className="text-gray-600 mb-6">
                  Unlock the complete security analysis with instant access
                </p>
                <Button
                  onClick={() => setShowPaywall(true)}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Full Report
                </Button>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Paywall Modal */}
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unlock Full Report</DialogTitle>
            <DialogDescription>
              Choose the package that works best for you. No subscription required.
            </DialogDescription>
          </DialogHeader>

          {/* Package Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            {PRICING_CONFIG.instant.packages.map((pkg, index) => (
              <button
                key={index}
                onClick={() => setSelectedPackage(index)}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  selectedPackage === index
                    ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                {pkg.savings && (
                  <Badge
                    variant="outline"
                    className="absolute -top-3 right-4 bg-green-50 text-green-700 border-green-300"
                  >
                    {pkg.savings}
                  </Badge>
                )}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{pkg.credits}</div>
                  <div className="text-sm text-gray-600 mb-4">
                    {pkg.credits === 1 ? "Report" : "Reports"}
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ${pkg.price}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${(pkg.price / pkg.credits).toFixed(2)} per report
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Trust Signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-y border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Instant Delivery</div>
                <div className="text-xs text-gray-500">Access in seconds</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Secure Payment</div>
                <div className="text-xs text-gray-500">Powered by Stripe</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">No Subscription</div>
                <div className="text-xs text-gray-500">One-time payment</div>
              </div>
            </div>
          </div>

          {/* Guest Email Collection (Optional) */}
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-600">
                Email (optional - for receipt)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handlePurchase}
              disabled={isCheckingOut}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCheckingOut ? (
                "Redirecting to checkout..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase for ${PRICING_CONFIG.instant.packages[selectedPackage].price}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Credits never expire. Use them anytime for future reports.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}