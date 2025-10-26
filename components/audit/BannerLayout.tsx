/**
 * BannerLayout Component
 *
 * Consolidates banner placement logic that was previously duplicated 4 times
 * in CryptoScanInterface. Manages banner visibility and placement based on
 * user state and scan progress.
 *
 * Placement Strategy:
 * - Top Leaderboard: Before scan (free/anonymous users only)
 * - Top Leaderboard: After scan (anonymous users only)
 * - Sidebar Rectangle: Desktop only, after scan
 * - Bottom Sticky: Mobile only, after scan
 */

import { BannerManager } from "@/components/banners/BannerManager";

interface BannerLayoutProps {
  user: any | null; // Stack Auth user object
  result: any | null; // Scan result data
  anonymousScansPerformed: number;
  userAccessStatus: {
    accessType: string;
    scansRemaining: number;
    instantCredits: number;
    accountType?: string;
  } | null;
  contractAddress?: string;
}

export function BannerLayout({
  user,
  result,
  anonymousScansPerformed,
  userAccessStatus,
  contractAddress,
}: BannerLayoutProps) {
  // Calculate scan count for banner analytics
  const scanCount = user
    ? 3 - (userAccessStatus?.scansRemaining || 0)
    : anonymousScansPerformed;

  // Determine banner visibility based on state
  const showTopLeaderboardBefore =
    !result && (!user || userAccessStatus?.accessType === "free");
  const showPostScanBanners =
    result || userAccessStatus?.scansRemaining === 0;

  return (
    <>
      {/* Top Leaderboard Banner - Before Scan */}
      {showTopLeaderboardBefore && (
        <div className="max-w-4xl mx-auto mb-8">
          <BannerManager placement="top_leaderboard" scanCount={scanCount} />
        </div>
      )}

      {/* Top Leaderboard Banner - After Scan (Anonymous Users Only) */}
      {!user && showPostScanBanners && (
        <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          <BannerManager
            placement="top_leaderboard"
            scanCount={scanCount}
            contractAddress={contractAddress}
          />
        </div>
      )}

      {/* Sidebar Rectangle Banner - Desktop Only, After Scan */}
      {showPostScanBanners && (
        <aside className="hidden lg:block fixed right-4 top-32 w-[300px] z-10">
          <BannerManager placement="sidebar_rectangle" scanCount={scanCount} />
        </aside>
      )}

      {/* Bottom Sticky Banner - Mobile Only, After Scan */}
      {showPostScanBanners && (
        <BannerManager placement="bottom_sticky" scanCount={scanCount} />
      )}
    </>
  );
}