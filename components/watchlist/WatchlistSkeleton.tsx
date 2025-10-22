"use client";

import { Card } from "@/components/ui/card";

export function WatchlistSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-6 sm:h-8 lg:h-10 xl:h-12 w-48 sm:w-64 lg:w-80 xl:w-96 bg-black/10 dark:bg-white/10 rounded animate-pulse mb-2 sm:mb-3" />
          <div className="h-3 sm:h-4 lg:h-5 w-64 sm:w-80 lg:w-96 xl:w-full max-w-2xl bg-black/10 dark:bg-white/10 rounded animate-pulse mb-1 sm:mb-2" />
          <div className="h-3 sm:h-4 w-24 sm:w-32 lg:w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-9 sm:h-10 lg:h-11 w-full sm:w-28 lg:w-32 xl:w-36 bg-black/10 dark:bg-white/10 rounded animate-pulse flex-shrink-0" />
      </div>

      {/* Watchlist cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="p-3 sm:p-4 lg:p-6 w-full">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Header row with title, badge, and icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="h-4 sm:h-5 lg:h-6 w-24 sm:w-32 lg:w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse flex-shrink-0" />
                  <div className="h-4 sm:h-5 w-12 sm:w-16 lg:w-20 bg-black/10 dark:bg-white/10 rounded-full animate-pulse flex-shrink-0" />
                </div>
                <div className="h-4 w-4 bg-black/10 dark:bg-white/10 rounded animate-pulse flex-shrink-0" />
              </div>

              {/* Contract address */}
              <div className="h-3 sm:h-4 w-full bg-black/10 dark:bg-white/10 rounded animate-pulse" />

              {/* Metadata row */}
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center gap-1">
                  <div className="h-3 sm:h-4 w-8 sm:w-12 lg:w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 w-6 sm:w-8 lg:w-12 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 sm:h-4 w-12 sm:w-16 lg:w-20 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 w-6 sm:w-8 lg:w-12 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 sm:h-4 w-8 sm:w-12 lg:w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-3 sm:h-4 w-6 sm:w-8 lg:w-12 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </div>
              </div>

              {/* Notes skeleton */}
              <div className="h-3 sm:h-4 w-2/3 lg:w-3/4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />

              {/* Alert configuration summary skeleton */}
              <div className="space-y-2">
                <div className="h-3 sm:h-4 w-1/2 lg:w-2/3 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <div className="h-4 sm:h-5 w-12 sm:w-16 lg:w-20 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                  <div className="h-4 sm:h-5 w-16 sm:w-20 lg:w-24 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                  <div className="h-4 sm:h-5 w-14 sm:w-18 lg:w-22 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-1 sm:gap-2 mt-2 sm:mt-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
