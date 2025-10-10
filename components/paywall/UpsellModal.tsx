/**
 * Upsell Modal Component
 *
 * Shows after successful instant purchase to encourage Pro subscription upgrade
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Zap, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PRICING_CONFIG } from "@/lib/config/pricing";
import { useAccessStatusDisplay } from "@/lib/hooks/useHasAccess";

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

export function UpsellModal({ open, onClose, creditsRemaining }: UpsellModalProps) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { accessLabel } = useAccessStatusDisplay();

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "pro",
        }),
      });

      const data = await response.json();

      if (data.status === "success" && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Upgrade failed");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to start upgrade. Please try again.");
      setIsUpgrading(false);
    }
  };

  const handleMaybeLater = () => {
    // Set a flag in localStorage to not show this again for 7 days
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "upsellDismissedUntil",
      (Date.now() + oneWeek).toString()
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <button
          onClick={handleMaybeLater}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <DialogTitle className="text-2xl">
              Unlock Unlimited Scans with Pro
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Current Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Credits</p>
              <p className="text-2xl font-bold text-blue-600">
                {creditsRemaining} {creditsRemaining === 1 ? "report" : "reports"} remaining
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              {accessLabel}
            </Badge>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Unlimited Scans</h3>
              <p className="text-sm text-gray-600">
                Scan as many contracts as you want. No limits, no worries.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Advanced Features</h3>
              <p className="text-sm text-gray-600">
                Email alerts, PDF exports, AI chat assistance, and priority support.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Keep Your Credits</h3>
              <p className="text-sm text-gray-600">
                Your {creditsRemaining} instant {creditsRemaining === 1 ? "credit" : "credits"} will be preserved and never expire.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Instant Reports</p>
              <p className="text-xl font-semibold">$4.99+ per scan</p>
            </div>
            <div className="text-2xl font-bold text-gray-400">→</div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pro Plan</p>
              <p className="text-3xl font-bold text-blue-600">
                ${PRICING_CONFIG.pro.price}/mo
              </p>
              <Badge className="mt-1 bg-green-600">Save 80%+ after 6 scans</Badge>
            </div>
          </div>

          <div className="text-xs text-center text-gray-500">
            Cancel anytime. No commitment required.
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg"
          >
            {isUpgrading ? (
              "Redirecting to checkout..."
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Upgrade to Pro for ${PRICING_CONFIG.pro.price}/month
              </>
            )}
          </Button>

          <Button
            onClick={handleMaybeLater}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Join hundreds of traders protecting their investments with Pro
        </p>
      </DialogContent>
    </Dialog>
  );
}