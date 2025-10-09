// components/referrals/ReferralBannerContainer.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { ReferralBanner } from "./ReferralBanner";

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
          console.error("Failed to fetch referral stats");
          setLoading(false);
          return;
        }

        const result = await response.json();
        setData({
          code: result.referralCode,
          stats: {
            confirmed: result.stats.confirmed,
            earned: { scans: result.stats.scansEarned },
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

  // Don't show banner while loading
  if (loading) {
    return null;
  }

  // Don't show banner if data fetch failed
  if (!data) {
    return null;
  }

  return (
    <div className="mx-4 mt-4 max-w-6xl lg:mx-auto">
      <ReferralBanner code={data.code} stats={data.stats} />
    </div>
  );
}
