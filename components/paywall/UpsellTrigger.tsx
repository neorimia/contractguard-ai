/**
 * Upsell Trigger Component
 *
 * Automatically shows upsell modal after successful instant purchase
 * Checks URL parameters and localStorage to determine when to show
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UpsellModal } from "./UpsellModal";
import { useHasAccess } from "@/lib/hooks/useHasAccess";

export function UpsellTrigger() {
  const searchParams = useSearchParams();
  const { accessType, instantCredits, isLoading } = useHasAccess();
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    // Don't show if still loading
    if (isLoading) return;

    // Check if this is a successful instant purchase
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      // Check if we should show the upsell (not dismissed recently)
      const dismissedUntil = localStorage.getItem("upsellDismissedUntil");
      const shouldShow =
        !dismissedUntil || Date.now() > parseInt(dismissedUntil);

      // Only show for instant credit users (not Pro/Team)
      if (
        shouldShow &&
        accessType === "instant_credit" &&
        instantCredits > 0
      ) {
        // Small delay for better UX
        setTimeout(() => {
          setShowUpsell(true);
        }, 1000);
      }
    }
  }, [searchParams, accessType, instantCredits, isLoading]);

  if (isLoading || accessType !== "instant_credit") {
    return null;
  }

  return (
    <UpsellModal
      open={showUpsell}
      onClose={() => setShowUpsell(false)}
      creditsRemaining={instantCredits}
    />
  );
}