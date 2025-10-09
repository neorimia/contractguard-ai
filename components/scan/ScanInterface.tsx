"use client";

import { useState, useEffect, useRef } from "react";
import { Audit } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScanResults from "@/components/ScanResults";
import ScanLimitDrawer from "@/components/ScanLimitDrawer";
import { MagicLinkSignIn, useUser } from "@stackframe/stack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { AILoadingState } from "./AILoadingState";
import Link from "next/link";

interface ScanLimitError {
  error: string;
  message: string;
  scansRemaining: number;
  resetAt: string;
  upgradeUrl: string;
  status: string;
}

export function ScanInterface() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Audit | null>(null);
  const [error, setError] = useState("");
  const [showLimitDrawer, setShowLimitDrawer] = useState(false);
  const [limitError, setLimitError] = useState<ScanLimitError | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const user = useUser();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when they're available
  useEffect(() => {
    if (result && resultsRef.current) {
      // Small delay to ensure results are rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [result]);

  const analyzeContract = async () => {
    if (!address) return;

    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Track scan initiated
    trackEvent(AnalyticsEvents.SCAN_INITIATED, {
      contractAddress: address,
      chain: "ethereum",
      userId: user.id,
    });

    setLoading(true);
    setError("");
    setResult(null);
    setShowLimitDrawer(false);
    setLimitError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: address,
          chain: "ethereum",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a scan limit error
        if (
          data.error === "Scan limit exceeded" ||
          (data.status === "error" && data.scansRemaining !== undefined)
        ) {
          // Track scan limit reached
          trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
            contractAddress: address,
            scansRemaining: data.scansRemaining,
            tier: data.tier || "free",
          });

          setLimitError(data);
          setShowLimitDrawer(true);
          return;
        }

        // Track scan failed
        trackEvent(AnalyticsEvents.SCAN_FAILED, {
          contractAddress: address,
          error: data.error || data.message,
        });

        throw new Error(data.message || "Analysis failed");
      }

      // Track scan completed
      trackEvent(AnalyticsEvents.SCAN_COMPLETED, {
        contractAddress: address,
        riskScore: data.riskScore,
        recommendation: data.recommendation,
        issuesFound: data.issues?.length || 0,
      });

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-5.5rem)] flex flex-col justify-center py-6 sm:py-10 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
        <div className="w-full max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 px-4">
          {/* Main Content */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white dark:text-black">
            Scan smart contracts{" "}
            <span className="bg-gradient-to-r from-white to-white/70 dark:from-black dark:to-black/70 bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>
          <p className="text-base sm:text-lg tracking-tight text-white/60 dark:text-black/60 max-w-2xl mx-auto">
            AI-powered security analysis that detects scams, honeypots, and rug
            pulls. Get instant results in plain English.
          </p>

          {/* Input Section or Loading State */}
          {loading ? (
            <div className="max-w-2xl mx-auto mt-8">
              <AILoadingState />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/20 rounded-2xl p-6">
                <label className="block text-sm font-medium text-white/80 dark:text-black/80 mb-3">
                  Contract Address
                </label>
                <div className="flex sm:flex-row flex-col gap-4">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && address && !loading) {
                        analyzeContract();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 dark:bg-black/5 border border-white/20 dark:border-black/20 rounded-lg text-white dark:text-black placeholder-white/50 dark:placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    disabled={loading}
                  />
                  <Button
                    onClick={analyzeContract}
                    disabled={loading || !address}
                    size="lg"
                    className="px-6 py-3 bg-white/95 dark:bg-black text-black dark:text-white hover:bg-white dark:hover:bg-black transition-all duration-300"
                  >
                    SCAN CONTRACT
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 dark:text-red-800 text-sm">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <div ref={resultsRef}>
          <ScanResults result={result} contractAddress={address} />
        </div>
      )}

      {/* Scan Limit Drawer */}
      {limitError && (
        <ScanLimitDrawer
          isOpen={showLimitDrawer}
          onClose={() => setShowLimitDrawer(false)}
          scansRemaining={limitError.scansRemaining}
          resetAt={limitError.resetAt}
          upgradeUrl={limitError.upgradeUrl || "/pricing"}
        />
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              Sign in to scan contracts
            </DialogTitle>
            <DialogDescription>
              Create an account or sign in to start scanning smart contracts.
              Free tier includes 3 scans per day.
              <br />
              By using the application, you agree to our{" "}
              <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
              <br />
              <Link href="/faq">Learn more about ContractGuard AI</Link>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <MagicLinkSignIn />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
