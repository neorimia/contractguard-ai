export default function ReferralsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 w-96 bg-gray-800 rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-6 w-[600px] bg-gray-800 rounded-lg animate-pulse mx-auto" />
        </div>

        {/* Social Proof Banner Skeleton */}
        <div className="mb-12">
          <div className="h-20 bg-gray-800 rounded-lg animate-pulse" />
        </div>

        {/* Dashboard Skeleton */}
        <div className="mb-12 space-y-6">
          <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Tier Cards Skeleton */}
        <div className="mb-12">
          <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Leaderboard Skeleton */}
        <div className="mb-12">
          <div className="h-10 w-96 bg-gray-800 rounded-lg animate-pulse mx-auto mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
