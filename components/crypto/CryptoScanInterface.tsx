"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Loader2, AlertCircle, ChevronDown } from "lucide-react";
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
  { value: "ethereum", label: "Ethereum", icon: "⟠", type: "evm" },
  { value: "bsc", label: "BSC", icon: "💎", type: "evm" },
  { value: "polygon", label: "Polygon", icon: "⬡", type: "evm" },
  { value: "arbitrum", label: "Arbitrum", icon: "🔷", type: "evm" },
  { value: "optimism", label: "Optimism", icon: "🔴", type: "evm" },
  { value: "base", label: "Base", icon: "🔵", type: "evm" },
  { value: "avalanche", label: "Avalanche", icon: "🔺", type: "evm" },
  // { value: "solana", label: "Solana", icon: "◎", type: "solana" },
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

    // Validate address format based on chain type
    const selectedChain = SUPPORTED_CHAINS.find((c) => c.value === chain);
    const trimmedAddress = address.trim();

    if (selectedChain?.type === "evm") {
      // EVM address validation (0x + 40 hex characters)
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        setError(
          "Invalid EVM contract address format (must be 0x followed by 40 hex characters)"
        );
        return;
      }
    } else if (selectedChain?.type === "solana") {
      // Solana address validation (base58, 32-44 characters)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (!base58Regex.test(trimmedAddress)) {
        setError(
          "Invalid Solana address format (must be base58 encoded, 32-44 characters)"
        );
        return;
      }
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
              support for 8 blockchains including Ethereum, BSC, Polygon,
              Arbitrum, Optimism, Base, Avalanche, and Solana.
            </p>
          </div>
        </div>

        {/* Scan Interface */}
        <Card className="max-w-4xl mx-auto bg-neutral-900 border-neutral-800">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Chain Selector */}
            <div className="space-y-3">
              <Label className="text-white text-sm font-medium">
                Select Blockchain
              </Label>

              {/* Mobile: Dropdown Select */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={loading}
                      className="w-full justify-between bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900 hover:text-white h-12"
                    >
                      <div className="flex items-center gap-2">
                        {/* <span className="text-lg">
                          {
                            SUPPORTED_CHAINS.find((c) => c.value === chain)
                              ?.icon
                          }
                        </span> */}
                        <span>
                          {
                            SUPPORTED_CHAINS.find((c) => c.value === chain)
                              ?.label
                          }
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-[300px] bg-neutral-900 border-neutral-800">
                    {SUPPORTED_CHAINS.map((c) => (
                      <DropdownMenuItem
                        key={c.value}
                        onClick={() => setChain(c.value)}
                        className="text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.icon}</span>
                          <span>{c.label}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Tabs */}
              <div className="hidden sm:block">
                <Tabs value={chain} onValueChange={setChain} className="w-full">
                  <TabsList className="grid grid-cols-8 gap-2 bg-transparent h-auto p-0">
                    {SUPPORTED_CHAINS.map((c) => (
                      <TabsTrigger
                        key={c.value}
                        value={c.value}
                        disabled={loading}
                        className="
                          data-[state=active]:bg-white data-[state=active]:text-black
                          bg-transparent text-white border border-neutral-700
                          hover:border-neutral-500 transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed
                          px-3 py-2 flex items-center justify-center gap-1
                        "
                      >
                        {/* <span className="text-base">{c.icon}</span> */}
                        <span className="text-xs">{c.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Address Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="address"
                  className="text-white text-sm font-medium"
                >
                  {chain === "solana" ? "Program Address" : "Contract Address"}
                </Label>
                {chain === "solana" && (
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 border-purple-500/20 text-purple-400"
                  >
                    <span className="mr-1">◎</span>
                    Base58 Format
                  </Badge>
                )}
              </div>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  chain === "solana"
                    ? "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                    : "0x..."
                }
                disabled={loading}
                className="
                  bg-neutral-950 border-neutral-800 text-white
                  placeholder:text-neutral-500 font-mono
                  focus-visible:ring-white focus-visible:ring-1
                  h-12
                "
              />
            </div>

            {/* Error Display */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Analyze Button */}
            <Button
              onClick={analyzeContract}
              disabled={loading || !address.trim()}
              size="lg"
              className="
                w-full py-6 bg-white text-black font-semibold
                hover:bg-neutral-200 transition-colors
                rounded-xl text-base
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
            <p className="text-center text-sm text-neutral-400">
              {chain === "solana"
                ? "Analysis includes: Program verification, token metadata, holder distribution, liquidity pairs, and security checks."
                : "Analysis includes: Contract verification, mint functions, holder concentration, liquidity lock, and ownership status."}
            </p>
          </CardContent>
        </Card>

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
