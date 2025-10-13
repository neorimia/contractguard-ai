"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { CryptoResultsDisplay } from "./CryptoResultsDisplay";
import { useUser } from "@stackframe/stack";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { CryptoAudit, RiskFlag } from "@/db/schema";
import { HeuristicResult } from "@/lib/services/crypto/types";

interface CryptoAnalysisResult extends CryptoAudit {
  recommendation?: string;
  heuristicResults?: HeuristicResult[];
}

const SUPPORTED_CHAINS = [
  { value: "ethereum", label: "Ethereum", icon: "Ξ" },
  { value: "bsc", label: "BSC", icon: "B" },
];

export function CryptoScanInterface() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CryptoAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const user = useUser();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when available
  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [result]);

  const analyzeContract = async () => {
    if (!address.trim()) {
      setError("Please enter a contract address");
      return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError("Invalid contract address format");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Track scan start
      trackEvent(AnalyticsEvents.CRYPTO_SCAN_STARTED, {
        chain,
        address: address.toLowerCase(),
        userId: user?.id,
      });

      const response = await fetch("/api/crypto/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address.trim(),
          chain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      if (data.status === "success") {
        setResult(data.data);

        // Track successful scan
        trackEvent(AnalyticsEvents.CRYPTO_SCAN_COMPLETED, {
          chain,
          address: address.toLowerCase(),
          riskScore: data.data.riskScore,
          riskCategory: data.data.riskCategory,
          cached: data.cached,
          userId: user?.id,
        });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze contract";
      setError(errorMessage);

      // Track error
      trackEvent(AnalyticsEvents.CRYPTO_SCAN_FAILED, {
        chain,
        address: address.toLowerCase(),
        error: errorMessage,
        userId: user?.id,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeContract();
    }
  };

  return (
    <section className="py-24 sm:py-32 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-8 mb-16">
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-white" />
            <span className="text-sm font-medium">Crypto Security Scanner</span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight">
              Analyze Smart
              <br />
              Contracts<span className="text-neutral-500">.</span>
            </h1>
            <p className="text-xl text-neutral-400 max-w-2xl">
              Detect scams, honeypots, and rug pulls in seconds. Multi-chain
              support for Ethereum and BSC.
            </p>
          </div>
        </div>

        {/* Scan Interface */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chain Selector */}
          <div className="flex gap-3">
            {SUPPORTED_CHAINS.map((c) => (
              <button
                key={c.value}
                onClick={() => setChain(c.value)}
                disabled={loading}
                className={`
                  px-6 py-3 rounded-lg border font-medium transition-all
                  ${
                    chain === c.value
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white border-neutral-700 hover:border-neutral-500"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="mr-2">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Address Input */}
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter contract address (0x...)"
              disabled={loading}
              className="
                w-full px-6 py-4 bg-neutral-900 border border-neutral-800
                rounded-xl text-white placeholder-neutral-500
                focus:outline-none focus:border-white
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                font-mono text-sm
              "
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeContract}
            disabled={loading || !address.trim()}
            className="
              w-full py-6 bg-white text-black font-semibold
              hover:bg-neutral-200 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              rounded-xl text-lg
            "
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Contract...
              </>
            ) : (
              <>
                Analyze Contract
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Info */}
          <div className="text-center text-sm text-neutral-500">
            <p>
              Analysis includes: Contract verification, mint functions, holder
              concentration, liquidity lock, and ownership status.
            </p>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="mt-24">
            <CryptoResultsDisplay result={result} contractAddress={address} />
          </div>
        )}
      </div>
    </section>
  );
}
