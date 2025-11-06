"use client";

import dynamic from "next/dynamic";

// Dynamically import PricingSectionHybrid with no SSR to avoid Stack Auth SSR issues
const PricingSectionHybridDynamic = dynamic(
  () => import("./PricingSectionHybrid"),
  {
    ssr: false,
    loading: () => (
      <section className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="text-left space-y-4 mb-12">
            <div className="h-10 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse w-2/3" />
            <div className="h-6 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse w-1/2" />
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-6"
              >
                {/* Title */}
                <div className="mb-4">
                  <div className="h-6 bg-black/5 dark:bg-white/5 rounded animate-pulse w-1/3 mb-2" />
                  <div className="h-4 bg-black/5 dark:bg-white/5 rounded animate-pulse w-2/3" />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="h-8 bg-black/5 dark:bg-white/5 rounded animate-pulse w-1/2" />
                </div>

                {/* Perks */}
                <div className="space-y-2 mb-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-black/5 dark:bg-white/5 rounded animate-pulse" />
                      <div className="h-3 bg-black/5 dark:bg-white/5 rounded animate-pulse flex-1" />
                    </div>
                  ))}
                </div>

                {/* Button */}
                <div className="h-9 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  }
);

export function PricingSectionHybridClient() {
  return <PricingSectionHybridDynamic />;
}