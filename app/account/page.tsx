"use client";

import { AccountSettings } from "@stackframe/stack";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";
import { useUser } from "@stackframe/stack";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";

export default function AccountPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "pro" | "enterprise">(
    "free"
  );

  // Check for success/cancel messages from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success")) {
      setMessage({
        type: "success",
        text: "🎉 Subscription successful! Welcome to Pro! Your unlimited scans are now active.",
      });
      // Clear URL parameters after 5 seconds
      setTimeout(() => {
        router.replace("/account");
      }, 5000);
    } else if (searchParams.get("canceled")) {
      setMessage({
        type: "error",
        text: "Checkout canceled. You can upgrade anytime from the pricing page.",
      });
      // Clear URL parameters after 5 seconds
      setTimeout(() => {
        router.replace("/account");
      }, 5000);
    }
  }, [searchParams, router]);

  // Fetch user tier from database
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const response = await fetch("/api/user/profile");
        const data = (await response.json()) as {
          tier?: "free" | "pro" | "enterprise";
        };
        if (data.tier) {
          setUserTier(data.tier);
        }
      } catch (error) {
        console.error("Failed to fetch user tier:", error);
      }
    };

    if (user) {
      fetchUserTier();
    }
  }, [user, searchParams]); // Re-fetch after Stripe redirect

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      setLoadingPortal(true);

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = (await response.json()) as {
        status?: string;
        error?: string;
        url?: string;
      };

      if (data.status === "error") {
        if (typeof window !== "undefined") {
          window.alert(data.error || "Failed to open subscription management");
        }
        return;
      }

      if (data.url) {
        if (typeof window !== "undefined") {
          window.location.href = data.url;
        }
      } else {
        if (typeof window !== "undefined") {
          window.alert("Failed to create portal session");
        }
      }
    } catch (error) {
      console.error("Portal error:", error);
      if (typeof window !== "undefined") {
        window.alert("An error occurred. Please try again.");
      }
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
      <div className="relative bg-white/95 dark:bg-black/5 pt-14">
        <Header />

        {/* Account Settings Section */}
        <section className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
          <div className="w-full max-w-5xl mx-auto px-4">
            {/* Page Header */}
            <div className="mb-8 space-y-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
                Account Settings
              </h1>
              <p className="text-sm sm:text-base tracking-tight text-black/60 dark:text-white/60">
                Manage your account preferences and settings
              </p>
            </div>

            {/* Success/Error Messages */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                  message.type === "success"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200"
                    : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Subscription Status Card */}
            <div className="mb-6 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        Current Plan
                      </h3>
                      {userTier !== "free" && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            userTier === "enterprise"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {userTier === "enterprise" ? (
                            <span className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Enterprise
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Pro
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-black dark:text-white mb-1">
                      {userTier === "free" && "Free Tier"}
                      {userTier === "pro" && "Pro Tier"}
                      {userTier === "enterprise" && "Enterprise"}
                    </p>
                    <p className="text-sm text-black/60 dark:text-white/60">
                      {userTier === "free" &&
                        "3 scans per day • Basic features"}
                      {userTier === "pro" &&
                        "100 scans per day • All Pro features"}
                      {userTier === "enterprise" &&
                        "Unlimited scans • Enterprise features"}
                    </p>
                  </div>

                  {/* Manage Subscription Button (Only for paid tiers) */}
                  {userTier !== "free" && (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                    >
                      {loadingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </>
                      )}
                    </Button>
                  )}

                  {/* Upgrade Button (Only for free tier) */}
                  {userTier === "free" && (
                    <Button
                      onClick={() => router.push("/pricing")}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings Component */}
            <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-black">
              <AccountSettings fullPage={false} />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
