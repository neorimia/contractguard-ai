"use client";

import { useEffect, useRef } from "react";
import { useScanState } from "@/hooks/useScanState";
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
import { ReportUpgradeModal } from "./ReportUpgradeModal";
import { TokenSearchInput, TokenSearchResult } from "./TokenSearchInput";
import { useUser } from "@stackframe/stack";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { CryptoAudit, RiskFlag } from "@/db/schema";
import { HeuristicResult } from "@/lib/services/crypto/types";
import { ReportResponse } from "@/lib/types/report-types";
import ScanLimitDrawer from "@/components/ScanLimitDrawer";
import { SoftSignupPrompt } from "@/components/auth/SoftSignupPrompt";
import { AccountUpgradeModal } from "@/components/auth/AccountUpgradeModal";
import { ScanOverview } from "@/components/scan/ScanOverview";
import { BannerManager } from "@/components/banners/BannerManager";
import { AILoadingState } from "@/components/scan/AILoadingState";
import { getTierLimit } from "@/lib/config/tier-limits";

interface CryptoAnalysisResult extends CryptoAudit {
  recommendation?: string;
  heuristicResults?: HeuristicResult[];
  scanMetadata?: ScanMetadata;
}

interface ScanLimitError {
  error: string;
  message: string;
  scansRemaining: number;
  resetAt: string;
  upgradeUrl: string;
  status: string;
}

interface ScanMetadata {
  accessType?: string;
  scansRemaining?: number;
  prompt?: string;
  sessionId?: string;
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
  // Replace 17 useState variables with single useReducer for better state management
  const { state, dispatch } = useScanState();

  // Extract commonly used state values for cleaner code
  const { address, chain, selectedAI } = state.form;
  const {
    loading,
    error,
    showLimitDrawer,
    showSoftSignupPrompt,
    showUpgradeModal,
    showReportUpgradeModal,
  } = state.ui;
  const { result, reportAccess, limitError, upgradeData } = state.data;
  const {
    userAccessStatus,
    anonymousScansPerformed,
    anonymousSessionId,
    scanMetadata,
  } = state.access;

  const user = useUser();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch user access status for authenticated users
  useEffect(() => {
    if (!user?.id) return;

    const controller = new AbortController();

    const fetchAccessStatus = async () => {
      try {
        const res = await fetch("/api/user/access-status", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        dispatch({
          type: "SET_USER_ACCESS_STATUS",
          payload: {
            accessType: data.accessType || "free",
            scansRemaining: data.scansRemaining || 0,
            instantCredits: data.instantCredits || 0,
            accountType: data.accountType,
          },
        });
      } catch (err: any) {
        // Ignore abort errors (cleanup)
        if (err.name !== "AbortError") {
          console.error("Failed to fetch access status:", err);
        }
      }
    };

    fetchAccessStatus();

    // Cleanup: abort pending request on unmount or user change
    return () => controller.abort();
  }, [user?.id, dispatch]);

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
      dispatch({
        type: "SET_ERROR",
        payload: "Please enter a contract address",
      });
      return;
    }

    // Validate address format based on chain type
    const selectedChain = SUPPORTED_CHAINS.find((c) => c.value === chain);
    const trimmedAddress = address.trim();

    if (selectedChain?.type === "evm") {
      // EVM address validation (0x + 40 hex characters)
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Invalid EVM contract address format (must be 0x followed by 40 hex characters)",
        });
        return;
      }
    } else if (selectedChain?.type === "solana") {
      // Solana address validation (base58, 32-44 characters)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (!base58Regex.test(trimmedAddress)) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Invalid Solana address format (must be base58 encoded, 32-44 characters)",
        });
        return;
      }
    }

    // Check if anonymous user has only 1 scan remaining (2 scans performed)
    // Show soft signup prompt before consuming the last scan
    if (!user && anonymousScansPerformed >= 2) {
      // Track early intervention to prevent last scan
      trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
        contractAddress: address,
        chain,
        scansPerformed: anonymousScansPerformed,
        scansRemaining: 1,
        accessType: "anonymous",
        intervention: "before_last_scan",
      });

      // Update scan metadata and show prompt using compound action
      dispatch({
        type: "ANONYMOUS_LIMIT_REACHED",
        payload: {
          scansPerformed: anonymousScansPerformed,
          sessionId: anonymousSessionId || undefined,
          scanMetadata: {
            accessType: "anonymous",
            scansRemaining: 1,
            sessionId: anonymousSessionId || undefined,
          },
        },
      });
      return;
    }

    // Track scan initiated (works for both anonymous and authenticated)
    trackEvent(AnalyticsEvents.CRYPTO_SCAN_STARTED, {
      chain,
      address: address.toLowerCase(),
      userId: user?.id,
      isAnonymous: !user,
    });

    // Use compound action to start scan (sets loading true, clears errors and results)
    dispatch({ type: "START_SCAN" });

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress: address.trim(),
          chain,
          aiProvider: selectedAI,
        }),
      });

      const data = await response.json();

      // Extract updated access status from response headers
      const updatedScansRemaining = response.headers.get("X-Scans-Remaining");
      const updatedInstantCredits = response.headers.get("X-Instant-Credits");
      const updatedAccessType = response.headers.get("X-Access-Type");

      if (!response.ok) {
        // Check if it's anonymous limit reached (prompt signup)
        if (data.action === "signup_required") {
          // Track anonymous limit reached
          trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
            contractAddress: address,
            chain,
            scansPerformed: data.scansPerformed || 3,
            accessType: "anonymous",
          });

          // Use compound action to handle anonymous limit reached
          dispatch({
            type: "ANONYMOUS_LIMIT_REACHED",
            payload: {
              scansPerformed: data.scansPerformed || 3,
              sessionId: data.sessionId,
              scanMetadata: {
                accessType: "anonymous",
                scansRemaining: 0,
                sessionId: data.sessionId,
              },
            },
          });
          return;
        }

        // Check if soft account needs upgrade
        if (data.action === "upgrade_required" && data.accountType === "soft") {
          // Track upgrade prompt
          trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
            contractAddress: address,
            chain,
            scansRemaining: data.scansRemaining || 0,
            accountType: "soft",
            action: "upgrade_required",
          });

          // Use compound action to handle soft account upgrade requirement
          dispatch({
            type: "SOFT_ACCOUNT_UPGRADE_REQUIRED",
            payload: {
              email: user?.primaryEmail || "",
              scansRemaining: data.scansRemaining || 0,
            },
          });
          return;
        }

        // Check if it's a scan limit error (authenticated user)
        if (
          data.error === "Scan limit exceeded" ||
          data.error === "Access limit exceeded" ||
          (data.status === "error" && data.scansRemaining !== undefined)
        ) {
          // Track scan limit reached
          trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
            contractAddress: address,
            chain,
            scansRemaining: data.scansRemaining,
            tier: data.tier || "free",
          });

          // Set limit error and show drawer
          dispatch({ type: "SET_LIMIT_ERROR", payload: data });
          dispatch({ type: "SET_SHOW_LIMIT_DRAWER", payload: true });
          return;
        }

        // Track scan failed
        trackEvent(AnalyticsEvents.CRYPTO_SCAN_FAILED, {
          chain,
          address: address.toLowerCase(),
          error: data.error || data.message,
        });

        throw new Error(data.error || "Analysis failed");
      }

      // Track successful scan
      trackEvent(AnalyticsEvents.CRYPTO_SCAN_COMPLETED, {
        chain,
        address: address.toLowerCase(),
        riskScore: data.data?.riskScore,
        riskCategory: data.data?.riskCategory,
        cached: data.cached,
        userId: user?.id,
        isAnonymous: !user,
      });

      // Set the audit result (for backward compatibility)
      dispatch({ type: "SET_RESULT", payload: data.data || data });

      // Set report access information (new paywall system)
      // The API now returns processed response based on access level
      if (data.data) {
        dispatch({ type: "SET_REPORT_ACCESS", payload: data.data });
      } else if (data.accessLevel) {
        // Direct ReportResponse format
        dispatch({ type: "SET_REPORT_ACCESS", payload: data });
      }

      // Handle anonymous scan metadata (check both wrapped and direct locations)
      if (data.data?.metadata || data.scanMetadata || data.metadata) {
        const metadata =
          data.data?.metadata || data.scanMetadata || data.metadata;
        dispatch({ type: "SET_SCAN_METADATA", payload: metadata });

        // Track anonymous scans performed
        if (metadata.accessType === "anonymous") {
          const scansPerformed = 3 - (metadata.scansRemaining || 0);
          dispatch({
            type: "SET_ANONYMOUS_SCANS_PERFORMED",
            payload: scansPerformed,
          });

          // Save sessionId for later use (when limit is reached)
          if (metadata.sessionId) {
            dispatch({
              type: "SET_ANONYMOUS_SESSION_ID",
              payload: metadata.sessionId,
            });
          }

          // Show soft signup prompt after 1st scan (early capture)
          if (scansPerformed >= 1) {
            dispatch({ type: "SET_SHOW_SOFT_SIGNUP_PROMPT", payload: true });
          }
        }

        // Update authenticated user access status after scan
        if (
          user &&
          (updatedScansRemaining !== null || updatedInstantCredits !== null)
        ) {
          dispatch({
            type: "UPDATE_USER_ACCESS_STATUS",
            payload: {
              accessType:
                updatedAccessType || userAccessStatus?.accessType || "free",
              scansRemaining: updatedScansRemaining
                ? parseInt(updatedScansRemaining)
                : userAccessStatus?.scansRemaining || 0,
              instantCredits: updatedInstantCredits
                ? parseInt(updatedInstantCredits)
                : userAccessStatus?.instantCredits || 0,
            },
          });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze contract";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeContract();
    }
  };

  // Handle token selection from search
  const handleTokenSelect = (result: TokenSearchResult) => {
    // Set address and chain from selected token
    dispatch({ type: "SET_ADDRESS", payload: result.address });
    dispatch({ type: "SET_CHAIN", payload: result.chain });

    // Track token search usage
    trackEvent(AnalyticsEvents.TOKEN_SEARCH_SELECTED, {
      tokenName: result.name,
      tokenSymbol: result.symbol,
      address: result.address,
      chain: result.chain,
      userId: user?.id,
      isAnonymous: !user,
    });
  };

  // Helper function to determine if AI selector should be shown
  const shouldShowAISelector = (): boolean => {
    if (!userAccessStatus) return false;

    return (
      userAccessStatus.accessType === "pro" ||
      userAccessStatus.accessType === "team" ||
      userAccessStatus.accessType === "instant_credit"
    );
  };

  // Paywall modal handlers
  const handleUpgradeClick = () => {
    dispatch({ type: "SET_SHOW_REPORT_UPGRADE_MODAL", payload: true });
  };

  const handleInstantPurchaseClick = () => {
    dispatch({ type: "SET_SHOW_REPORT_UPGRADE_MODAL", payload: true });
  };

  const handleReportUpgradeSuccess = () => {
    dispatch({ type: "SET_SHOW_REPORT_UPGRADE_MODAL", payload: false });
    // Optionally refresh the report or re-scan
    if (address && chain) {
      analyzeContract();
    }
  };

  const handleReportUpgradeError = (error: string) => {
    console.error("Upgrade error:", error);
    dispatch({ type: "SET_ERROR", payload: error });
  };

  return (
    <>
      <section className="py-24 sm:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8 flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-white" />
              <span className="text-sm font-medium">
                Crypto Security Scanner
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight">
                Analyze Smart
                <br />
                Contracts<span className="text-neutral-500">.</span>
              </h1>
              <p className="text-xl text-neutral-400 max-w-2xl">
                Detect scams, honeypots, and rug pulls in seconds. Multi-chain
                support for 7 blockchains including Ethereum, BSC, Polygon,
                Arbitrum, Optimism, Base, and Avalanche.
              </p>
            </div>
          </div>

          {/* Banners - Show before scanning for free/anonymous users */}
          {!result && (!user || userAccessStatus?.accessType === "free") && (
            <div className="max-w-4xl mx-auto mb-8">
              <BannerManager
                placement="top_leaderboard"
                scanCount={
                  user
                    ? 3 - (userAccessStatus?.scansRemaining || 0)
                    : anonymousScansPerformed
                }
              />
            </div>
          )}

          {/* Scan Overview - Show scan limits for all users */}
          {(() => {
            if (!user) {
              // Anonymous user - always show
              return (
                <div className="max-w-4xl mx-auto mb-8">
                  <ScanOverview
                    scansPerformed={anonymousScansPerformed}
                    scansRemaining={scanMetadata?.scansRemaining ?? 3}
                    maxScans={3}
                    isAnonymous={true}
                  />
                </div>
              );
            } else if (user && userAccessStatus) {
              // Authenticated user - calculate tier-specific max scans
              const maxScans = getTierLimit(userAccessStatus.accessType);
              const isUnlimited = maxScans === -1;
              const scansPerformed = isUnlimited
                ? 0 // Unlimited tier displays differently
                : maxScans - userAccessStatus.scansRemaining;

              return (
                <div className="max-w-4xl mx-auto mb-8">
                  <ScanOverview
                    scansPerformed={scansPerformed}
                    scansRemaining={userAccessStatus.scansRemaining}
                    maxScans={isUnlimited ? 0 : maxScans}
                    tier={userAccessStatus.accessType}
                    instantCredits={userAccessStatus.instantCredits}
                    isAnonymous={false}
                  />
                </div>
              );
            }
            return null;
          })()}

          {/* Scan Interface */}
          {loading ? (
            <div className="max-w-4xl mx-auto">
              <AILoadingState />
            </div>
          ) : (
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
                            onClick={() =>
                              dispatch({ type: "SET_CHAIN", payload: c.value })
                            }
                            className="text-white hover:bg-neutral-800 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {/*<span className="text-lg">{c.icon}</span>*/}
                              <span>{c.label}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Desktop: Tabs */}
                  <div className="hidden sm:block">
                    <Tabs
                      value={chain}
                      onValueChange={(value) =>
                        dispatch({ type: "SET_CHAIN", payload: value })
                      }
                      className="w-full"
                    >
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
                {/* Alert for unsupported chains */}
                {chain && !SUPPORTED_CHAINS.find((c) => c.value === chain) && (
                  <div className="bg-red-500/10 border-red-500/20 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Unsupported blockchain. Please select a supported
                      blockchain.
                    </p>
                  </div>
                )}

                {/* AI Provider Selection */}
                {shouldShowAISelector() && (
                  <div className="space-y-3">
                    <Label className="text-white text-sm font-medium">
                      Select AI Provider
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={loading}
                          className="w-full justify-between bg-neutral-950 border-neutral-800 text-white hover:bg-neutral-900 hover:text-white h-12"
                        >
                          <span>
                            {selectedAI === "chatgpt" ? "ChatGPT" : "Claude"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-[300px] bg-neutral-900 border-neutral-800">
                        <DropdownMenuItem
                          onClick={() =>
                            dispatch({
                              type: "SET_AI_PROVIDER",
                              payload: "chatgpt",
                            })
                          }
                          className="text-white hover:bg-neutral-800 cursor-pointer"
                        >
                          <span>ChatGPT</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            dispatch({
                              type: "SET_AI_PROVIDER",
                              payload: "claude",
                            })
                          }
                          className="text-white hover:bg-neutral-800 cursor-pointer"
                        >
                          <span>Claude</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Token Search Input */}
                {chain !== "solana" && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white text-sm font-medium">
                        Search by Token Name
                      </Label>
                    </div>
                    <TokenSearchInput
                      onSelect={handleTokenSelect}
                      defaultChain={chain}
                      placeholder="Search token by name (e.g., PEPE, SHIB)"
                      className="w-full"
                    />
                  </div>
                )}

                <p className="text-xs text-neutral-400">
                  Or enter contract address manually below
                </p>

                {/* Address Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="address"
                      className="text-white text-sm font-medium"
                    >
                      {chain === "solana"
                        ? "Program Address"
                        : "Contract Address"}
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
                    onChange={(e) =>
                      dispatch({ type: "SET_ADDRESS", payload: e.target.value })
                    }
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
          )}

          {/* Results */}
          {result && (
            <div ref={resultsRef} className="mt-24">
              <CryptoResultsDisplay
                result={result}
                contractAddress={address}
                reportAccess={reportAccess}
                onUpgradeClick={handleUpgradeClick}
                onInstantPurchaseClick={handleInstantPurchaseClick}
              />
            </div>
          )}
        </div>
      </section>

      {/* Soft Signup Prompt (for anonymous users after 1+ scans) */}
      {!user && (anonymousSessionId || scanMetadata?.sessionId) && (
        <SoftSignupPrompt
          isOpen={showSoftSignupPrompt}
          onClose={() =>
            dispatch({ type: "SET_SHOW_SOFT_SIGNUP_PROMPT", payload: false })
          }
          scansPerformed={anonymousScansPerformed}
          scansRemaining={scanMetadata?.scansRemaining || 0}
          anonymousSessionId={
            anonymousSessionId || scanMetadata?.sessionId || ""
          }
        />
      )}

      {/* Top Leaderboard Banner - Show after scan results */}
      {!user && (result || userAccessStatus?.scansRemaining === 0) && (
        <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          <BannerManager
            placement="top_leaderboard"
            scanCount={
              user
                ? 3 - (userAccessStatus?.scansRemaining || 0)
                : anonymousScansPerformed
            }
            contractAddress={address}
          />
        </div>
      )}

      {/* Sidebar Rectangle Banner - Desktop Only, Fixed to Right */}
      {(result || userAccessStatus?.scansRemaining === 0) && (
        <aside className="hidden lg:block fixed right-4 top-32 w-[300px] z-10">
          <BannerManager
            placement="sidebar_rectangle"
            scanCount={
              user
                ? 3 - (userAccessStatus?.scansRemaining || 0)
                : anonymousScansPerformed
            }
          />
        </aside>
      )}

      {/* Bottom Sticky Banner - Mobile Only, Fixed to Bottom */}
      {(result || userAccessStatus?.scansRemaining === 0) && (
        <BannerManager
          placement="bottom_sticky"
          scanCount={
            user
              ? 3 - (userAccessStatus?.scansRemaining || 0)
              : anonymousScansPerformed
          }
        />
      )}

      {/* Scan Limit Drawer */}
      {limitError && (
        <ScanLimitDrawer
          isOpen={showLimitDrawer}
          onClose={() =>
            dispatch({ type: "SET_SHOW_LIMIT_DRAWER", payload: false })
          }
          scansRemaining={limitError.scansRemaining}
          resetAt={limitError.resetAt}
          upgradeUrl={limitError.upgradeUrl || "/pricing"}
        />
      )}

      {/* Account Upgrade Modal (for soft accounts) */}
      {showUpgradeModal && upgradeData && (
        <AccountUpgradeModal
          isOpen={showUpgradeModal}
          email={upgradeData.email}
          accountType="soft"
          scansRemaining={upgradeData.scansRemaining}
          onClose={() =>
            dispatch({ type: "SET_SHOW_UPGRADE_MODAL", payload: false })
          }
        />
      )}

      {/* Report Upgrade Modal (for paywall system) */}
      {showReportUpgradeModal &&
        reportAccess &&
        reportAccess.accessLevel === "summary" && (
          <ReportUpgradeModal
            open={showReportUpgradeModal}
            onOpenChange={(open) =>
              dispatch({ type: "SET_SHOW_REPORT_UPGRADE_MODAL", payload: open })
            }
            data={reportAccess}
            onSuccess={handleReportUpgradeSuccess}
            onError={handleReportUpgradeError}
          />
        )}
    </>
  );
}
