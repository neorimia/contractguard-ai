// components/referrals/ReferralBanner.tsx
"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
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
    <div className="relative w-full overflow-hidden rounded-xl bg-black/95 dark:bg-white/95 p-6 sm:p-10 md:p-16">
      {/* Concentric circles decoration */}
      <div className="absolute inset-0 hidden h-full w-full overflow-hidden md:block">
        <div className="absolute top-1/2 right-[-45%] aspect-square h-[800px] w-[800px] -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-white/10 dark:bg-black/10  "></div>
          <div className="absolute inset-0 scale-[0.8] rounded-full bg-white/10"></div>
          <div className="absolute inset-0 scale-[0.6] rounded-full bg-white/10 dark:bg-black/10"></div>
          <div className="absolute inset-0 scale-[0.4] rounded-full bg-white/10 dark:bg-black/10"></div>
          <div className="absolute inset-0 scale-[0.2] rounded-full bg-white/10 dark:bg-black/10"></div>
          <div className="absolute inset-0 scale-[0.1] rounded-full bg-white/20 dark:bg-black/20"></div>
        </div>
      </div>

      <div className="relative z-10">
        <h1 className="mb-3 text-3xl font-bold text-white dark:text-black sm:text-4xl md:mb-4 md:text-5xl">
          Invite Friends, Earn Rewards 💎
        </h1>
        <p className="mb-4 max-w-2xl text-base text-white/90 dark:text-black/90 sm:text-lg md:mb-6">
          Share your unique link. You get <strong>+5 scans</strong> for each
          friend who joins. They get <strong>+3 scans</strong> as a welcome
          bonus!
        </p>

        {/* Stats */}
        <div className="mb-6 flex gap-8 text-white dark:text-black md:mb-8">
          <div>
            <div className="text-3xl font-bold sm:text-4xl">
              {stats.confirmed}
            </div>
            <div className="text-sm text-white/70 dark:text-black/70 sm:text-base">
              Friends Joined
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold sm:text-4xl">
              {stats.earned.scans}
            </div>
            <div className="text-sm text-white/70 dark:text-black/70 sm:text-base">
              Scans Earned
            </div>
          </div>
        </div>

        {/* Link and buttons */}
        <div className="space-y-4">
          <input
            type="text"
            readOnly
            value={link}
            className="w-full rounded-full border border-white/30 bg-white/10 dark:bg-black/10 px-6 py-3 text-sm font-mono text-white dark:text-black backdrop-blur-sm placeholder:text-white/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 sm:text-base"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-between rounded-full bg-white dark:bg-black px-6 py-3 text-black dark:text-white transition-all hover:bg-white/90 dark:hover:bg-black/90 sm:w-[240px]"
            >
              <span className="font-semibold">
                {copied ? "Copied!" : "Copy Link"}
              </span>
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black dark:bg-white">
                {copied ? (
                  <Check size={14} className="text-white dark:text-black" />
                ) : (
                  <Copy size={14} className="text-white dark:text-black" />
                )}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex w-full items-center justify-between rounded-full bg-white dark:bg-black px-6 py-3 text-black dark:text-white transition-all hover:bg-white/90 dark:hover:bg-black/90 sm:w-[240px]"
            >
              <span className="font-semibold">Share Link</span>
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black dark:bg-white">
                <Share2 size={14} className="text-white dark:text-black" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
