"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { CheckCircle, XCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics/posthog";

// Custom hooks
import { useBillingData } from "./hooks/useBillingData";
import { useInvoices } from "./hooks/useInvoices";
import { useUsage } from "./hooks/useUsage";
import { useInstantCredits } from "./hooks/useInstantCredits";
import { useUserTier } from "./hooks/useUserTier";

// Components
import { SubscriptionCard } from "./components/SubscriptionCard";
import { PaymentMethodCard } from "./components/PaymentMethodCard";
import { InvoiceList } from "./components/InvoiceList";
import { InstantCreditsCard } from "./components/InstantCreditsCard";
import { UsageStats } from "./components/UsageStats";
import { CancelModal } from "./components/CancelModal";
import { BillingSkeleton } from "./components/BillingSkeleton";

// Security: Validate URLs are from trusted domains
const TRUSTED_DOMAINS = [
  "https://billing.stripe.com",
  "https://checkout.stripe.com",
  "https://dashboard.stripe.com",
];

const isValidRedirectUrl = (url: string): boolean => {
  try {
    new URL(url);
    return TRUSTED_DOMAINS.some((domain) => url.startsWith(domain));
  } catch {
    return false;
  }
};

export default function BillingPage() {
  const user = useUser();
  const router = useRouter();

  // Fetch data using custom hooks
  const {
    subscription,
    paymentMethod,
    tier,
    isLoading: isLoadingBilling,
    refetch: refetchBilling,
  } = useBillingData();
  const { tier: userTier, isLoading: isLoadingTier } = useUserTier();
  const { invoices, isLoading: isLoadingInvoices } = useInvoices({ limit: 10 });
  const { usage, isLoading: isLoadingUsage } = useUsage();
  const { credits, isLoading: isLoadingCredits } = useInstantCredits();

  // Combined loading state
  const isLoading =
    isLoadingBilling ||
    isLoadingTier ||
    isLoadingInvoices ||
    isLoadingUsage ||
    isLoadingCredits;

  // Local state
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingReactivate, setLoadingReactivate] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Redirect if not logged in - immediate return for security
  if (!user) {
    return null;
  }

  // Track page view
  if (subscription) {
    trackEvent("billing_page_viewed", {
      tier: tier || "free",
      hasSubscription: !!subscription,
      hasInstantCredits: (credits?.balance ?? 0) > 0,
    });
  }

  // Handle Stripe portal
  const handleManagePayment = async () => {
    try {
      setLoadingPortal(true);

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        if (isValidRedirectUrl(data.url)) {
          window.location.href = data.url;
        } else {
          console.error("Invalid redirect URL:", data.url);
          setMessage({
            type: "error",
            text: "Invalid payment portal URL. Please contact support.",
          });
        }
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
        await refetchBilling();
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
        await refetchBilling();
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

          {/* Loading Skeleton */}
          {isLoading && <BillingSkeleton />}

          {/* Actual Content */}
          {!isLoading && (
            <>
              {/* Messages */}
              {message && (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                    message.type === "success"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle
                      className="h-5 w-5 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="h-5 w-5 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Subscription Overview */}
                  <SubscriptionCard
                    subscription={subscription}
                    userTier={userTier}
                    onCancelClick={() => setShowCancelModal(true)}
                    onReactivate={handleReactivate}
                    loadingReactivate={loadingReactivate}
                  />

                  {/* Instant Credits */}
                  <InstantCreditsCard credits={credits} />

                  {/* Billing History */}
                  <InvoiceList invoices={invoices} />
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Payment Method */}
                  <PaymentMethodCard
                    paymentMethod={paymentMethod}
                    onManagePayment={handleManagePayment}
                    loading={loadingPortal}
                  />

                  {/* Usage Stats */}
                  <UsageStats usage={usage} />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Cancel Subscription Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        loading={loadingCancel}
        reason={cancelReason}
        onReasonChange={setCancelReason}
      />
    </>
  );
}
