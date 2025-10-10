"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Crown,
  Zap,
  XCircle,
  Edit,
  Coins,
  ShoppingCart,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics/posthog";

// Types
interface SubscriptionData {
  id: string;
  status: string;
  tier: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  amount: number;
  currency: string;
  interval: string;
}

interface PaymentMethodData {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

interface InvoiceData {
  id: string;
  number: string;
  status: string;
  amountPaid: number;
  currency: string;
  created: string;
  hostedInvoiceUrl: string;
  invoicePdf: string;
  description: string;
}

interface PurchaseData {
  id: string;
  type: "instant_credits" | "pro_subscription" | "team_subscription";
  credits: number | null;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
  completedAt: string | null;
}

interface InstantCreditsData {
  balance: number;
  usedToday: number;
  totalPurchased: number;
  recentPurchases: PurchaseData[];
}

interface UsageData {
  current: {
    scansToday: number;
    scansThisMonth: number;
    limit: number;
    resetAt: string;
  };
  tier: string;
}

export default function BillingPage() {
  const user = useUser();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData | null>(
    null
  );
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [instantCredits, setInstantCredits] =
    useState<InstantCreditsData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [userTier, setUserTier] = useState<"free" | "pro" | "enterprise">(
    "free"
  );

  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingReactivate, setLoadingReactivate] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);

        // Parallel fetch
        const [billingRes, invoicesRes, usageRes, creditsRes] =
          await Promise.all([
            fetch("/api/user/billing"),
            fetch("/api/user/billing/invoices?limit=10"),
            fetch("/api/user/usage"),
            fetch("/api/user/credits"),
          ]);

        const billingData = await billingRes.json();
        const invoicesData = await invoicesRes.json();
        const usageData = await usageRes.json();
        const creditsData = await creditsRes.json();

        if (billingData.status === "success") {
          setSubscription(billingData.data.subscription);
          setPaymentMethod(billingData.data.paymentMethod);
          setUserTier(billingData.data.tier || "free");
        }

        if (invoicesData.status === "success") {
          setInvoices(invoicesData.data.invoices);
        }

        if (usageData.status === "success") {
          setUsage(usageData.data);
          fetchUserTier(); // Re-fetch after Stripe redirect
        }

        if (creditsData.status === "success") {
          setInstantCredits(creditsData.data);
        }

        // Track page view
        trackEvent("billing_page_viewed", {
          tier: billingData.data?.tier || "free",
          hasSubscription: !!billingData.data?.subscription,
          hasInstantCredits: creditsData.data?.balance > 0,
        });
        console.log("Fetched billing data");
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
        setMessage({
          type: "error",
          text: "Failed to load billing information. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    // Fetch user tier from database
    const fetchUserTier = async () => {
      try {
        const response = await fetch("/api/user/profile");
        const data = (await response.json()) as {
          tier?: "free" | "pro" | "enterprise";
        };
        console.log("Fetched user tier response:", data);
        if (data.tier) {
          setUserTier(data.tier);
        }
        console.log("Fetched user tier");
      } catch (error) {
        console.error("Failed to fetch user tier:", error);
      }
    };

    if (user) {
      fetchBillingData();
    }
  }, [user]);

  // Handle Stripe portal
  const handleManagePayment = async () => {
    try {
      setLoadingPortal(true);

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to open payment portal",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    try {
      setLoadingCancel(true);

      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          immediately: false,
          feedback: cancelReason,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setMessage({
          type: "success",
          text: "Subscription canceled. You'll have access until the end of your billing period.",
        });
        setShowCancelModal(false);
        // Refresh data
        window.location.reload();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel subscription",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setLoadingCancel(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivate = async () => {
    try {
      setLoadingReactivate(true);

      const response = await fetch("/api/stripe/reactivate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.status === "success") {
        setMessage({
          type: "success",
          text: "Subscription reactivated successfully!",
        });
        // Refresh data
        window.location.reload();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to reactivate subscription",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setLoadingReactivate(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate billing progress
  const calculateProgress = () => {
    if (!subscription) return 0;

    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();

    const total = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <section className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
        <div className="w-full max-w-6xl mx-auto px-4">
          {/* Page Header Skeleton */}
          <div className="mb-8 space-y-2">
            <div className="h-10 w-64 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-5 w-96 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          </div>

          {/* Grid Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subscription Overview Skeleton */}
              <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="h-7 w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                  </div>

                  {/* Title and Price */}
                  <div className="flex items-baseline justify-between">
                    <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-7 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  </div>

                  {/* Next billing date */}
                  <div className="h-5 w-56 bg-black/10 dark:bg-white/10 rounded animate-pulse" />

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                        <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 h-10 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
                    <div className="flex-1 h-10 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Billing History Skeleton */}
              <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="h-7 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-6" />

                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 border border-black/5 dark:border-white/5 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-5 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                            <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="h-6 w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                            <div className="h-8 w-8 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-4 w-64 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Payment Method Skeleton */}
              <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="h-6 w-36 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-4" />

                  <div className="p-4 border border-black/5 dark:border-white/5 rounded-lg mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-5 w-5 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      <div className="h-5 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-36 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  </div>

                  <div className="h-10 w-full bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
                </div>
              </div>

              {/* Usage Stats Skeleton */}
              <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="h-6 w-36 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-4" />

                  <div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-1" />
                  <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-2" />
                  <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-4">
                    <div className="flex justify-between">
                      <div className="h-5 w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                      <div className="h-5 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Main Content */}
      <section className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
        <div className="w-full max-w-6xl mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black dark:text-white">
              Billing & Subscription
            </h1>
            <p className="text-sm sm:text-base tracking-tight text-black/60 dark:text-white/60">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200"
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

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subscription Overview */}
              {subscription ? (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-black dark:text-white">
                        Current Subscription
                      </h2>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                          userTier === "enterprise"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {userTier === "enterprise" ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Enterprise
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3" />
                            Pro
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-4">
                      <h3 className="text-2xl font-bold text-black dark:text-white capitalize">
                        {userTier} Plan
                      </h3>
                      <span className="text-xl font-semibold text-black dark:text-white">
                        ${(subscription.amount / 100).toFixed(2)}/
                        {subscription.interval}
                      </span>
                    </div>

                    <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                      Next billing date:{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                        <span>Billing Cycle Progress</span>
                        <span>{Math.round(calculateProgress())}% complete</span>
                      </div>
                      <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black dark:bg-white transition-all duration-500"
                          style={{ width: `${calculateProgress()}%` }}
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5 mb-6">
                      <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>
                          {userTier === "pro" ? "100" : "Unlimited"} scans per
                          day
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>Priority support</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-black dark:text-white">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>Advanced analytics</span>
                      </div>
                    </div>

                    {/* Cancellation Notice */}
                    {subscription.cancelAtPeriodEnd && (
                      <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              Your subscription will cancel on{" "}
                              {formatDate(subscription.currentPeriodEnd)}
                            </p>
                            <Button
                              variant="link"
                              onClick={handleReactivate}
                              disabled={loadingReactivate}
                              className="mt-2 p-0 h-auto text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                            >
                              {loadingReactivate ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Reactivating...
                                </>
                              ) : (
                                "Reactivate subscription"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-3">
                      {userTier !== "enterprise" && (
                        <Button
                          className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                          onClick={() => router.push("/pricing")}
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade to Enterprise
                        </Button>
                      )}

                      {!subscription.cancelAtPeriodEnd && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowCancelModal(true)}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] p-6">
                  <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                    Free Tier
                  </h2>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                    Upgrade to unlock more scans and advanced features
                  </p>
                  <Button
                    className="w-full bg-black dark:bg-white text-white dark:text-black"
                    onClick={() => router.push("/pricing")}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}

              {/* Instant Credits */}
              {instantCredits && (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-black dark:text-white">
                        Instant Report Credits
                      </h2>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Pay-per-scan
                      </span>
                    </div>

                    {/* Credits Balance */}
                    <div className="mb-6">
                      <p className="text-sm text-black/60 dark:text-white/60 mb-2">
                        Available Credits
                      </p>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-black dark:text-white">
                          {instantCredits.balance}
                        </span>
                        <span className="text-lg text-black/60 dark:text-white/60">
                          {instantCredits.balance === 1 ? "report" : "reports"}
                        </span>
                      </div>
                      {instantCredits.usedToday > 0 && (
                        <p className="text-xs text-black/60 dark:text-white/60">
                          {instantCredits.usedToday} used today
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 border border-black/5 dark:border-white/5 rounded-lg bg-black/5 dark:bg-white/5">
                      <div>
                        <p className="text-xs text-black/60 dark:text-white/60 mb-1">
                          Total Purchased
                        </p>
                        <p className="text-lg font-semibold text-black dark:text-white">
                          {instantCredits.totalPurchased}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-black/60 dark:text-white/60 mb-1">
                          Remaining
                        </p>
                        <p className="text-lg font-semibold text-black dark:text-white">
                          {instantCredits.balance}
                        </p>
                      </div>
                    </div>

                    {/* Recent Purchases */}
                    {instantCredits.recentPurchases.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-black dark:text-white mb-3">
                          Recent Credit Purchases
                        </h3>
                        <div className="space-y-2">
                          {instantCredits.recentPurchases
                            .slice(0, 3)
                            .map((purchase) => (
                              <div
                                key={purchase.id}
                                className="flex items-center justify-between p-3 border border-black/5 dark:border-white/5 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Coins className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <div>
                                    <p className="text-sm font-medium text-black dark:text-white">
                                      {purchase.credits}{" "}
                                      {purchase.credits === 1
                                        ? "Report"
                                        : "Reports"}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/60">
                                      {formatDate(purchase.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      purchase.status === "completed"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                        : purchase.status === "pending"
                                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {purchase.status}
                                  </span>
                                  <span className="text-sm font-semibold text-black dark:text-white">
                                    ${(purchase.amount / 100).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Buy More Button */}
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => router.push("/pricing")}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy More Credits
                    </Button>
                  </div>
                </div>
              )}

              {/* Billing History */}
              {invoices.length > 0 && (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
                      Billing History
                    </h2>

                    <div className="space-y-3">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="p-4 border border-black/5 dark:border-white/5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-black dark:text-white">
                                {formatDate(invoice.created)}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                }`}
                              >
                                {invoice.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-lg font-semibold text-black dark:text-white">
                                ${(invoice.amountPaid / 100).toFixed(2)}
                              </span>

                              {invoice.invoicePdf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(invoice.invoicePdf, "_blank")
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-black/60 dark:text-white/60">
                            {invoice.number} • {invoice.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Payment Method */}
              <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                    Payment Method
                  </h3>

                  {paymentMethod ? (
                    <>
                      <div className="p-4 border border-black/5 dark:border-white/5 rounded-lg bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <CreditCard className="h-5 w-5 text-black/60 dark:text-white/60" />
                          <span className="font-mono text-black dark:text-white">
                            •••• {paymentMethod.card.last4}
                          </span>
                        </div>
                        <p className="text-sm text-black/60 dark:text-white/60">
                          {paymentMethod.card.brand.toUpperCase()} • Expires{" "}
                          {paymentMethod.card.expMonth}/
                          {paymentMethod.card.expYear}
                        </p>
                      </div>

                      <Button
                        onClick={handleManagePayment}
                        disabled={loadingPortal}
                        variant="outline"
                        className="w-full"
                      >
                        {loadingPortal ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Payment
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                        No payment method on file
                      </p>
                      <Button
                        onClick={handleManagePayment}
                        disabled={loadingPortal}
                        variant="outline"
                        className="w-full"
                      >
                        {loadingPortal ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Add Payment Method"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              {usage && (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Usage Statistics
                    </h3>

                    <div>
                      <p className="text-sm text-black/60 dark:text-white/60 mb-1">
                        Today
                      </p>
                      <p className="text-2xl font-bold text-black dark:text-white mb-2">
                        {usage.current.scansToday} /{" "}
                        {usage.current.limit === 999999
                          ? "∞"
                          : usage.current.limit}{" "}
                        scans
                      </p>

                      {usage.current.limit !== 999999 && (
                        <>
                          <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-black dark:bg-white transition-all duration-500"
                              style={{
                                width: `${Math.min((usage.current.scansToday / usage.current.limit) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-black/60 dark:text-white/60">
                            Resets {formatDate(usage.current.resetAt)}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60 dark:text-white/60">
                          This Month
                        </span>
                        <span className="font-semibold text-black dark:text-white">
                          {usage.current.scansThisMonth} scans
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instant Credits Summary */}
              {instantCredits && instantCredits.balance > 0 && (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                      <Coins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      Instant Credits
                    </h3>

                    <div className="mb-4">
                      <p className="text-sm text-black/60 dark:text-white/60 mb-1">
                        Available
                      </p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {instantCredits.balance}
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                        {instantCredits.balance === 1 ? "report" : "reports"}{" "}
                        remaining
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                      onClick={() => router.push("/pricing")}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Cancel Subscription
            </h3>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              Are you sure you want to cancel your subscription? You'll have
              access until the end of your current billing period.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Tell us why (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black text-black dark:text-white"
                rows={3}
                placeholder="Your feedback helps us improve..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
                disabled={loadingCancel}
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={loadingCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loadingCancel ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
