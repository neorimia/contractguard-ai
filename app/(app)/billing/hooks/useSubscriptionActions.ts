import { useState } from "react";
import { useSWRConfig } from "swr";

interface UseSubscriptionActionsProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  refetchBilling?: () => void;
}

interface CancelSubscriptionParams {
  immediately?: boolean;
  feedback?: string;
}

export function useSubscriptionActions({
  onSuccess,
  onError,
  refetchBilling,
}: UseSubscriptionActionsProps = {}) {
  const { mutate } = useSWRConfig();
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingReactivate, setLoadingReactivate] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Handle subscription cancellation with optimistic updates
  const cancelSubscription = async (params: CancelSubscriptionParams = {}) => {
    try {
      setLoadingCancel(true);

      // Optimistic update - immediately mark as pending cancellation
      mutate(
        "/api/user/billing",
        (currentData: any) => {
          if (!currentData?.data?.subscription) return currentData;
          return {
            ...currentData,
            data: {
              ...currentData.data,
              subscription: {
                ...currentData.data.subscription,
                cancelAtPeriodEnd: true,
              },
            },
          };
        },
        false // Don't revalidate immediately
      );

      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          immediately: params.immediately || false,
          feedback: params.feedback || "",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        // Revalidate to get actual server state
        await mutate("/api/user/billing");
        onSuccess?.(
          "Subscription canceled. You'll have access until the end of your billing period."
        );
        refetchBilling?.();
      } else {
        // Rollback optimistic update on error
        await mutate("/api/user/billing");
        onError?.(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      // Rollback optimistic update on error
      await mutate("/api/user/billing");
      onError?.("An error occurred. Please try again.");
    } finally {
      setLoadingCancel(false);
    }
  };

  // Handle subscription reactivation with optimistic updates
  const reactivateSubscription = async () => {
    try {
      setLoadingReactivate(true);

      // Optimistic update - immediately remove cancellation
      mutate(
        "/api/user/billing",
        (currentData: any) => {
          if (!currentData?.data?.subscription) return currentData;
          return {
            ...currentData,
            data: {
              ...currentData.data,
              subscription: {
                ...currentData.data.subscription,
                cancelAtPeriodEnd: false,
              },
            },
          };
        },
        false
      );

      const response = await fetch("/api/stripe/reactivate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.status === "success") {
        await mutate("/api/user/billing");
        onSuccess?.("Subscription reactivated successfully!");
        refetchBilling?.();
      } else {
        await mutate("/api/user/billing");
        onError?.(data.error || "Failed to reactivate subscription");
      }
    } catch (error) {
      await mutate("/api/user/billing");
      onError?.("An error occurred. Please try again.");
    } finally {
      setLoadingReactivate(false);
    }
  };

  // Handle Stripe portal
  const openStripePortal = async () => {
    try {
      setLoadingPortal(true);

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        // Validate URL before redirect
        const TRUSTED_DOMAINS = [
          "https://billing.stripe.com",
          "https://checkout.stripe.com",
          "https://dashboard.stripe.com",
        ];

        try {
          new URL(data.url);
          const isValid = TRUSTED_DOMAINS.some((domain) =>
            data.url.startsWith(domain)
          );

          if (isValid) {
            window.location.href = data.url;
          } else {
            console.error("Invalid redirect URL:", data.url);
            onError?.(
              "Invalid payment portal URL. Please contact support if this persists."
            );
          }
        } catch {
          onError?.("Invalid URL format. Please contact support.");
        }
      } else {
        onError?.(
          data.error ||
            "Unable to open payment portal. Please try again or contact support."
        );
      }
    } catch (error) {
      onError?.(
        "Network error occurred. Please check your connection and try again."
      );
    } finally {
      setLoadingPortal(false);
    }
  };

  return {
    cancelSubscription,
    reactivateSubscription,
    openStripePortal,
    loadingCancel,
    loadingReactivate,
    loadingPortal,
  };
}
