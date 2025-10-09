export function LayoutSkeleton() {
  return (
    <div className="min-h-[calc(100vh-5.5rem)] py-6 sm:py-10 bg-white dark:bg-black mx-2 sm:mx-4 mt-1 mb-4 rounded-xl">
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Page Header Skeleton */}
        <div className="mb-8 space-y-3">
          <div className="h-10 w-64 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-96 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>

        {/* Content Card Skeleton */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02]">
          <div className="p-6 space-y-6">
            {/* Section 1 */}
            <div className="space-y-3">
              <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            </div>

            {/* Section 2 */}
            <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
                <div className="h-32 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="h-6 w-40 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

