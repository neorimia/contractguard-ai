// components/banners/types/banner.types.ts

import { Banner as DBBanner } from "@/db/schema";

export type BannerPlacement =
  | "top_leaderboard"
  | "sidebar_rectangle"
  | "bottom_sticky"
  | "inline_result"
  | "modal_overlay";

export type BannerType =
  | "internal_upgrade"
  | "partner_ad"
  | "feature_education"
  | "social_proof"
  | "urgency";

export type BannerCategory =
  | "upgrade"
  | "educational"
  | "winback"
  | "paywall"
  | "partnership";

export type Banner = DBBanner;

export interface BannerProps {
  banner: Banner;
  onClick: () => void;
  onDismiss?: () => void;
}
