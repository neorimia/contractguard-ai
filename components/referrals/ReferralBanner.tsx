// components/referrals/ReferralBanner.tsx
"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";

interface ReferralBannerProps {
  code: string;
  stats: {
    confirmed: number;
    earned: { scans: number };
  };
}

export function ReferralBanner({ code, stats }: ReferralBannerProps) {
  const [copied, setCopied] = useState(false);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai"}/ref/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track copy event
      trackEvent(AnalyticsEvents.REFERRAL_LINK_COPIED, {
        referralCode: code,
        friendsJoined: stats.confirmed,
        scansEarned: stats.earned.scans,
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join ContractGuard AI",
          text: "Check out ContractGuard AI - AI-powered smart contract security scanner! Get +3 free scans when you sign up.",
          url: link,
        });

        // Track share event
        trackEvent(AnalyticsEvents.REFERRAL_LINK_SHARED, {
          referralCode: code,
          shareMethod: "native",
          friendsJoined: stats.confirmed,
          scansEarned: stats.earned.scans,
        });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 text-white shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative">
        <h3 className="text-xl font-bold">
          Invite Friends, Earn Rewards 💎
        </h3>

        <p className="mt-2 text-sm text-white/90">
          Share your unique link. You get <strong>+5 scans</strong> for each friend who joins.
          They get <strong>+3 scans</strong> as a welcome bonus!
        </p>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <div className="text-white/70">Friends Joined</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.earned.scans}</div>
            <div className="text-white/70">Scans Earned</div>
          </div>
        </div>

        {/* Link input */}
        <div className="mt-6 flex gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />

          <Button
            onClick={handleCopy}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </Button>

          <Button
            onClick={handleShare}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}