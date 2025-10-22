"use client";

import dynamic from "next/dynamic";

// Dynamically import PricingSectionHybrid with no SSR to avoid Stack Auth SSR issues
const PricingSectionHybridDynamic = dynamic(
  () => import("./PricingSectionHybrid"),
  {
    ssr: false,
    loading: () => (
      <section className="py-20 sm:py-32 bg-white dark:bg-black mx-2 sm:mx-4 mb-4 rounded-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-6 mb-10">
            <div className="h-12 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse w-2/3 mx-auto" />
            <div className="h-6 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      </section>
    ),
  }
);

export function PricingSectionHybridClient() {
  return <PricingSectionHybridDynamic />;
}