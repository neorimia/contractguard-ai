// components/referrals/ReferralBannerSkeleton.tsx
"use client";

export function ReferralBannerSkeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-6 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 sm:p-10 md:p-16">
      {/* Concentric circles decoration */}
      <div className="absolute inset-0 hidden h-full w-full overflow-hidden md:block">
        <div className="absolute top-1/2 right-[-45%] aspect-square h-[800px] w-[800px] -translate-y-1/2">
          <div className="absolute inset-0 rounded-full bg-white/5"></div>
          <div className="absolute inset-0 scale-[0.8] rounded-full bg-white/5"></div>
          <div className="absolute inset-0 scale-[0.6] rounded-full bg-white/5"></div>
          <div className="absolute inset-0 scale-[0.4] rounded-full bg-white/5"></div>
          <div className="absolute inset-0 scale-[0.2] rounded-full bg-white/5"></div>
          <div className="absolute inset-0 scale-[0.1] rounded-full bg-white/10"></div>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/20 sm:h-12 md:h-14"></div>
          <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-white/15 sm:h-6"></div>
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-8">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-white/15"></div>
            <div className="h-10 w-16 animate-pulse rounded-lg bg-white/20"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-white/15"></div>
            <div className="h-10 w-16 animate-pulse rounded-lg bg-white/20"></div>
          </div>
        </div>

        {/* Link and buttons skeleton */}
        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-full bg-white/15"></div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="h-12 w-full animate-pulse rounded-full bg-white/30 sm:w-[240px]"></div>
            <div className="h-12 w-full animate-pulse rounded-full bg-white/30 sm:w-[240px]"></div>
          </div>
        </div>
      </div>

      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
}
