"use client";

import { AccountSettings } from "@stackframe/stack";
import { useUser } from "@stackframe/stack";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { CheckCircle, XCircle } from "lucide-react";
import { AnalyticsEvents, trackConversion } from "@/lib/analytics/posthog";
import { trackEvent } from "@/lib/analytics/posthog";

export default function AccountPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [userTier, setUserTier] = useState<
    "free" | "starter" | "pro" | "team" | "enterprise"
  >("free");
  const [loadingTier, setLoadingTier] = useState(true);
  const [tierError, setTierError] = useState<string | null>(null);

  // Check for success/cancel messages from Stripe redirect
  useEffect(() => {
    if (searchParams.get("canceled")) {
      // Track checkout cancellation
      trackEvent(AnalyticsEvents.CHECKOUT_CANCELED, {
        source: "stripe_checkout",
      });

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
        setLoadingTier(true);
        const response = await fetch("/api/user/profile");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as {
          tier?: "free" | "starter" | "pro" | "team" | "enterprise";
          status?: string;
        };

        if (data.status === "error") {
          console.error("API returned error:", data);
          setTierError("Failed to load subscription status");
          return;
        }

        if (data.tier) {
          const fetchedTier = data.tier as
            | "free"
            | "starter"
            | "pro"
            | "team"
            | "enterprise";
          setUserTier(fetchedTier);
          setTierError(null); // Clear any previous errors

          // Handle successful checkout
          if (searchParams.get("success") && fetchedTier !== "free") {
            // Track successful checkout completion
            trackEvent(AnalyticsEvents.CHECKOUT_COMPLETED, {
              sessionId: searchParams.get("session_id"),
              source: "account_redirect",
              tier: fetchedTier,
            });

            // Track conversion with actual tier price
            const tierPrices = {
              starter: 14,
              pro: 29,
              team: 99,
              enterprise: 99,
            };
            trackConversion(
              "subscription_purchase",
              tierPrices[fetchedTier] || 0,
              {
                tier: fetchedTier,
              }
            );

            // Dynamic success message based on tier
            const tierNames = {
              starter: "Starter",
              pro: "Pro",
              team: "Team",
              enterprise: "Team",
            };
            const tierMessages = {
              starter: "Your 30 monthly scans are now active.",
              pro: "Your 150 monthly scans are now active.",
              team: "Your 1000 monthly scans and API access are now active.",
              enterprise: "Your 1000 monthly scans and API access are now active.",
            };

            setMessage({
              type: "success",
              text: `🎉 Subscription successful! Welcome to ${tierNames[fetchedTier]}! ${tierMessages[fetchedTier]}`,
            });

            // Clear URL parameters after 5 seconds
            setTimeout(() => {
              router.replace("/account");
            }, 5000);
          }
        } else {
          // Default to free if no tier is returned
          setUserTier("free");
          setTierError("No subscription tier found");
        }
      } catch (error) {
        console.error("Failed to fetch user tier:", error);
        // Set to free tier on error to prevent UI issues
        setUserTier("free");
        setTierError("Failed to load subscription status");
      } finally {
        setLoadingTier(false);
      }
    };

    if (user) {
      void fetchUserTier();
    }
  }, [user, searchParams, router]); // Re-fetch after Stripe redirect

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle subscription management
  const handleManageSubscription = async () => {
    // Track portal opened
    trackEvent(AnalyticsEvents.PORTAL_OPENED, {
      tier: userTier,
      userId: user?.id,
    });

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
        <SubscriptionCard
          userTier={userTier}
          loadingPortal={loadingPortal}
          onManageSubscription={handleManageSubscription}
          onUpgrade={() => router.push("/pricing")}
          isLoading={loadingTier}
        />

        {/* Account Settings Component */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-black">
          <AccountSettings fullPage={false} />
        </div>
      </div>
    </section>
  );
}
