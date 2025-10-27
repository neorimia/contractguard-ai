"use client";

export function BillingSkeleton() {
  return (
    <>
      {/* Page Header Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-10 w-80 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        <div className="h-6 w-96 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
      </div>

      {/* Grid Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Card Skeleton */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
            <div className="p-6 space-y-6">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-7 w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-24 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
              </div>

              {/* Title and Price Skeleton */}
              <div className="flex items-baseline justify-between">
                <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-7 w-28 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>

              {/* Progress Bar Skeleton */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
                <div className="h-4 w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>

              {/* Features Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Buttons Skeleton */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="h-10 flex-1 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-10 flex-1 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Instant Credits Card Skeleton */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-7 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-28 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="flex items-baseline gap-2">
                  <div className="h-10 w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>

              <div className="h-10 w-full bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Billing History Skeleton */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="h-7 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-6" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 border border-black/5 dark:border-white/5 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-24 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                      </div>
                      <div className="h-6 w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-64 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Payment Method Card Skeleton */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-7 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="p-4 border border-black/5 dark:border-white/5 rounded-lg bg-gradient-to-br from-black/5 to-transparent dark:from-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-5 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Usage Stats Skeleton */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="h-7 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-8 w-32 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
              <div className="pt-4 border-t border-black/5 dark:border-white/5">
                <div className="h-4 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
