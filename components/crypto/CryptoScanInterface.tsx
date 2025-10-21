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
import { ReportUpgradeModal } from "./ReportUpgradeModal";
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
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CryptoAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showLimitDrawer, setShowLimitDrawer] = useState(false);
  const [limitError, setLimitError] = useState<ScanLimitError | null>(null);
  const [scanMetadata, setScanMetadata] = useState<ScanMetadata | null>(null);
  const [anonymousScansPerformed, setAnonymousScansPerformed] = useState(0);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(
    null
  );
  const [showSoftSignupPrompt, setShowSoftSignupPrompt] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{
    email: string;
    scansRemaining: number;
  } | null>(null);
  const [userAccessStatus, setUserAccessStatus] = useState<{
    accessType: string;
    scansRemaining: number;
    instantCredits: number;
    accountType?: string;
  } | null>(null);

  // New paywall-related state
  const [reportAccess, setReportAccess] = useState<ReportResponse | null>(null);
  const [showReportUpgradeModal, setShowReportUpgradeModal] = useState(false);

  const user = useUser();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch user access status for authenticated users
  useEffect(() => {
    if (user) {
      fetch("/api/user/access-status")
        .then((res) => res.json())
        .then((data) => {
          setUserAccessStatus({
            accessType: data.accessType || "free",
            scansRemaining: data.scansRemaining || 0,
            instantCredits: data.instantCredits || 0,
            accountType: data.accountType,
          });
        })
        .catch((err) => console.error("Failed to fetch access status:", err));
    }
  }, [user]);

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

      // Update scan metadata to show current state
      setScanMetadata({
        accessType: "anonymous",
        scansRemaining: 1,
        sessionId: anonymousSessionId || undefined,
      });

      setShowSoftSignupPrompt(true);
      setError(
        "You've used your free scans. Sign up to continue with 3 free scans daily!"
      );
      return;
    }

    // Track scan initiated (works for both anonymous and authenticated)
    trackEvent(AnalyticsEvents.CRYPTO_SCAN_STARTED, {
      chain,
      address: address.toLowerCase(),
      userId: user?.id,
      isAnonymous: !user,
    });

    setLoading(true);
    setError("");
    setResult(null);
    setShowLimitDrawer(false);
    setLimitError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress: address.trim(),
          chain,
        }),
      });

      const data = await response.json();

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

          // Update state from error response
          if (data.scansPerformed) {
            setAnonymousScansPerformed(data.scansPerformed);
          }
          if (data.sessionId) {
            setAnonymousSessionId(data.sessionId);
          }

          // Update scan metadata to show 0 remaining
          setScanMetadata({
            accessType: "anonymous",
            scansRemaining: 0,
            sessionId: data.sessionId,
          });

          setShowSoftSignupPrompt(true);
          setError(
            "You've used your free scans. Sign up to continue with 3 free scans daily!"
          );
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

          setUpgradeData({
            email: user?.primaryEmail || "",
            scansRemaining: data.scansRemaining || 0,
          });
          setShowUpgradeModal(true);
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

          setLimitError(data);
          setShowLimitDrawer(true);
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
      setResult(data.data || data);

      // Set report access information (new paywall system)
      // The API now returns processed response based on access level
      if (data.data) {
        setReportAccess(data.data);
      } else if (data.accessLevel) {
        // Direct ReportResponse format
        setReportAccess(data);
      }

      // Handle anonymous scan metadata (check both wrapped and direct locations)
      if (data.data?.metadata || data.scanMetadata || data.metadata) {
        const metadata =
          data.data?.metadata || data.scanMetadata || data.metadata;
        setScanMetadata(metadata);

        // Track anonymous scans performed
        if (metadata.accessType === "anonymous") {
          const scansPerformed = 3 - (metadata.scansRemaining || 0);
          setAnonymousScansPerformed(scansPerformed);

          // Save sessionId for later use (when limit is reached)
          if (metadata.sessionId) {
            setAnonymousSessionId(metadata.sessionId);
          }

          // Show soft signup prompt after 1st scan (early capture)
          if (scansPerformed >= 1) {
            setShowSoftSignupPrompt(true);
          }
        }

        // Update authenticated user access status after scan
        if (user && metadata.scansRemaining !== undefined) {
          setUserAccessStatus((prev) => ({
            accessType: prev?.accessType || "free",
            scansRemaining: metadata.scansRemaining,
            instantCredits: prev?.instantCredits || 0,
            accountType: prev?.accountType,
          }));
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze contract";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeContract();
    }
  };

  // Paywall modal handlers
  const handleUpgradeClick = () => {
    setShowReportUpgradeModal(true);
  };

  const handleInstantPurchaseClick = () => {
    setShowReportUpgradeModal(true);
  };

  const handleReportUpgradeSuccess = () => {
    setShowReportUpgradeModal(false);
    // Optionally refresh the report or re-scan
    if (address && chain) {
      analyzeContract();
    }
  };

  const handleReportUpgradeError = (error: string) => {
    console.error("Upgrade error:", error);
    setError(error);
  };

  return (
    <>
      <section className="py-24 sm:py-32 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-8 mb-16">
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
                support for 8 blockchains including Ethereum, BSC, Polygon,
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
                            onClick={() => setChain(c.value)}
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
                      onValueChange={setChain}
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
          onClose={() => setShowSoftSignupPrompt(false)}
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
          onClose={() => setShowLimitDrawer(false)}
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
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Report Upgrade Modal (for paywall system) */}
      {showReportUpgradeModal &&
        reportAccess &&
        reportAccess.accessLevel === "summary" && (
          <ReportUpgradeModal
            open={showReportUpgradeModal}
            onOpenChange={setShowReportUpgradeModal}
            data={reportAccess}
            onSuccess={handleReportUpgradeSuccess}
            onError={handleReportUpgradeError}
          />
        )}
    </>
  );
}
