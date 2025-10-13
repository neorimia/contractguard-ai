"use client";

import { useState, useEffect, useRef } from "react";
import { Audit } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScanResults from "@/components/ScanResults";
import ScanLimitDrawer from "@/components/ScanLimitDrawer";
import { SoftSignupPrompt } from "@/components/auth/SoftSignupPrompt";
import { AccountUpgradeModal } from "@/components/auth/AccountUpgradeModal";
import { ScanOverview } from "@/components/scan/ScanOverview";
import { BannerManager } from "@/components/banners/BannerManager";
import { useUser } from "@stackframe/stack";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";
import { AILoadingState } from "./AILoadingState";

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

interface AnonymousLimitError {
  error: string;
  message: string;
  action: string;
  scansPerformed: number;
  maxScans: number;
  sessionId: string;
  status: string;
}

export function ScanInterface() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Audit | null>(null);
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
    // Validate address is not empty
    if (!address.trim()) {
      setError("Please enter a contract address");
      return;
    }

    // Validate EVM address format (0x + 40 hex characters)
    const trimmedAddress = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      setError(
        "Invalid Ethereum contract address format (must be 0x followed by 40 hex characters)"
      );
      return;
    }

    // Check if anonymous user has only 1 scan remaining (2 scans performed)
    // Show soft signup prompt before consuming the last scan
    if (!user && anonymousScansPerformed >= 2) {
      // Track early intervention to prevent last scan
      trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
        contractAddress: address,
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
    trackEvent(AnalyticsEvents.SCAN_INITIATED, {
      contractAddress: address,
      chain: "ethereum",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: address,
          chain: "ethereum",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's anonymous limit reached (prompt signup)
        if (data.action === "signup_required") {
          // Track anonymous limit reached
          trackEvent(AnalyticsEvents.SCAN_LIMIT_REACHED, {
            contractAddress: address,
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
        isAnonymous: !user,
      });

      setResult(data);

      // Handle anonymous scan metadata
      if (data.metadata) {
        setScanMetadata(data.metadata);

        // Track anonymous scans performed
        if (data.metadata.accessType === "anonymous") {
          const scansPerformed = 3 - (data.metadata.scansRemaining || 0);
          setAnonymousScansPerformed(scansPerformed);

          // Save sessionId for later use (when limit is reached)
          if (data.metadata.sessionId) {
            setAnonymousSessionId(data.metadata.sessionId);
          }

          // Show soft signup prompt after 1st scan (early capture)
          if (scansPerformed >= 1) {
            setShowSoftSignupPrompt(true);
          }
        }

        // Update authenticated user access status after scan
        if (user && data.metadata.scansRemaining !== undefined) {
          setUserAccessStatus((prev) => ({
            accessType: prev?.accessType || "free",
            scansRemaining: data.metadata.scansRemaining,
            instantCredits: prev?.instantCredits || 0,
            accountType: prev?.accountType,
          }));
        }
      }
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

          {/* Crypto.com Affiliate Banner - Show before scanning for free/anonymous users */}
          {!result && (!user || userAccessStatus?.accessType === "free") && (
            <div className="max-w-4xl mx-auto mt-6">
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

          {/* Scan Overview (for all users) */}
          {/* Always visible to create awareness of scan limits */}
          {(() => {
            console.log("Scan Overview Check:", {
              hasUser: !!user,
              anonymousScansPerformed,
              userAccessStatus,
              scanMetadata,
            });

            if (!user) {
              // Anonymous user - always show
              return (
                <ScanOverview
                  scansPerformed={anonymousScansPerformed}
                  scansRemaining={scanMetadata?.scansRemaining ?? 3}
                  maxScans={3}
                  isAnonymous={true}
                />
              );
            } else if (user && userAccessStatus) {
              // Authenticated user
              return (
                <ScanOverview
                  scansPerformed={3 - userAccessStatus.scansRemaining}
                  scansRemaining={userAccessStatus.scansRemaining}
                  maxScans={3}
                  tier={userAccessStatus.accessType}
                  instantCredits={userAccessStatus.instantCredits}
                  isAnonymous={false}
                />
              );
            }
            return null;
          })()}

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

      {/* Soft Signup Drawer (for anonymous users after 1+ scans) */}
      {/* Shows after completing scans, becomes mandatory before 3rd scan */}
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

      {/* Results Section */}
      {result && (
        <div ref={resultsRef}>
          <ScanResults result={result} contractAddress={address} />
        </div>
      )}

      {/* Top Leaderboard Banner - Show after scan results */}
      {!user && (result || userAccessStatus?.scansRemaining === 0) && (
        <div className="max-w-6xl mx-auto mt-8 px-4">
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
    </>
  );
}
