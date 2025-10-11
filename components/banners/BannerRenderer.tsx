"use client";

import { Banner } from "./types/banner.types";
import { LeaderboardBanner } from "./templates/LeaderboardBanner";
import { RectangleBanner } from "./templates/RectangleBanner";
import { StickyBanner } from "./templates/StickyBanner";

interface BannerRendererProps {
  banner: Banner;
  onClick: () => void;
  onDismiss?: () => void;
}

export function BannerRenderer({
  banner,
  onClick,
  onDismiss,
}: BannerRendererProps) {
  // External partner ads use iframe embed
  if (banner.isExternal && banner.partnerScriptUrl) {
    return (
      <div className="partner-ad-container">
        <iframe
          src={banner.partnerScriptUrl}
          data-ad-unit={banner.partnerAdUnitId}
          className="w-full h-full border-0"
          title="Partner Advertisement"
        />
      </div>
    );
  }

  // Internal banner templates
  switch (banner.placement) {
    case "top_leaderboard":
      return (
        <LeaderboardBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "sidebar_rectangle":
      return (
        <RectangleBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "bottom_sticky":
      return (
        <StickyBanner banner={banner} onClick={onClick} onDismiss={onDismiss} />
      );
    case "inline_result":
      return (
        <LeaderboardBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    case "modal_overlay":
      return (
        <RectangleBanner
          banner={banner}
          onClick={onClick}
          onDismiss={onDismiss}
        />
      );
    default:
      return null;
  }
}
