// components/referrals/ReferralBannerContainer.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { ReferralBanner } from "./ReferralBanner";
import { ReferralBannerSkeleton } from "./ReferralBannerSkeleton";

export function ReferralBannerContainer() {
  const user = useUser();
  const [data, setData] = useState<{
    code: string;
    stats: { confirmed: number; earned: { scans: number } };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferralData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/referrals/stats");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch referral stats:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || "Unknown error",
          });
          setLoading(false);
          return;
        }

        const result = await response.json();

        // Validate response structure
        if (!result.referralCode || !result.stats) {
          console.error("Invalid referral stats response:", result);
          setLoading(false);
          return;
        }

        setData({
          code: result.referralCode,
          stats: {
            confirmed: result.stats.confirmed || 0,
            earned: { scans: result.stats.scansEarned || 0 },
          },
        });
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReferralData();
  }, [user]);

  // Don't show banner if user is not logged in
  if (!user) {
    return null;
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="mx-2 my-4 max-w-6xl lg:mx-auto">
        <ReferralBannerSkeleton />
      </div>
    );
  }

  // Don't show banner if data fetch failed
  if (!data) {
    return null;
  }

  return (
    <div className="mx-2 my-4 max-w-6xl lg:mx-auto">
      <ReferralBanner code={data.code} stats={data.stats} />
    </div>
  );
}
