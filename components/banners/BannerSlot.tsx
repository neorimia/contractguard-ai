"use client";

import { useEffect, useRef, useState } from "react";
import { BannerRenderer } from "./BannerRenderer";
import { Banner, BannerPlacement } from "./types/banner.types";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics/posthog";

interface BannerSlotProps {
  banner: Banner;
  sessionId: string;
  placement: BannerPlacement;
  scanCount?: number;
  contractAddress?: string;
}

export function BannerSlot({
  banner,
  sessionId,
  placement,
  scanCount,
  contractAddress,
}: BannerSlotProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const impressionTracked = useRef(false);
  const visibilityTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if banner was recently dismissed
    const dismissedKey = `banner_dismissed_${banner.id}`;
    const dismissedAt = localStorage.getItem(dismissedKey);

    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = Date.now();
      const hoursSinceDismiss = (now - dismissedTime) / (1000 * 60 * 60);

      // Respect 24-hour dismissal period
      if (hoursSinceDismiss < 24) {
        setDismissed(true);
        return;
      }
    }

    // Implement viewability: banner must be 50% visible for 1 second
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visibilityTimerRef.current = setTimeout(() => {
              setVisible(true);
            }, 1000);
          } else {
            if (visibilityTimerRef.current) {
              clearTimeout(visibilityTimerRef.current);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [banner.id]);

  useEffect(() => {
    // Track impression once visible
    if (visible && !impressionTracked.current) {
      impressionTracked.current = true;

      // Track impression in database
      fetch("/api/banners/impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bannerId: banner.id,
          sessionId,
          placement,
          scanCount,
          contractAddress,
          userAgent: navigator.userAgent,
          deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
        }),
      }).catch((error) => console.error("Failed to track impression:", error));

      // Track in PostHog
      trackEvent(AnalyticsEvents.BANNER_IMPRESSION, {
        bannerId: banner.id,
        bannerName: banner.name,
        placement,
        type: banner.type,
        category: banner.category,
      });
    }
  }, [visible, banner, sessionId, placement, scanCount, contractAddress]);

  const handleClick = async () => {
    // Track click
    await fetch("/api/banners/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bannerId: banner.id,
        sessionId,
      }),
    }).catch((error) => console.error("Failed to track click:", error));

    trackEvent(AnalyticsEvents.BANNER_CLICK, {
      bannerId: banner.id,
      bannerName: banner.name,
      placement,
      ctaUrl: banner.ctaUrl,
    });

    // Navigate to CTA URL
    if (banner.ctaUrl.startsWith("http")) {
      window.open(banner.ctaUrl, "_blank");
    } else {
      window.location.href = banner.ctaUrl;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(
      `banner_dismissed_${banner.id}`,
      new Date().toISOString()
    );

    trackEvent(AnalyticsEvents.BANNER_DISMISSED, {
      bannerId: banner.id,
      bannerName: banner.name,
      placement,
    });
  };

  if (dismissed) return null;

  return (
    <div ref={elementRef} id={`banner-${banner.id}`} className="banner-slot">
      <BannerRenderer
        banner={banner}
        onClick={handleClick}
        onDismiss={banner.metadata?.dismissible ? handleDismiss : undefined}
      />
    </div>
  );
}
