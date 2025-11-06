export function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* Logo skeleton */}
          <div className="h-8 w-8 bg-black/10 dark:bg-white/10 rounded-full animate-pulse mr-4" />

          {/* Navigation skeleton */}
          <div className="hidden md:flex items-center gap-6">
            <div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          </div>

          {/* Actions skeleton */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="h-9 w-20 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}
