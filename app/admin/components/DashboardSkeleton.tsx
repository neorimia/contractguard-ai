// components/admin/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Date Range Picker Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-muted rounded-md"></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-32 bg-muted rounded"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-3 w-28 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <div className="bg-card rounded-lg border p-6">
        <div className="h-6 w-40 bg-muted rounded mb-4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="h-6 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="h-6 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Stats Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </div>
            <div className="h-8 w-16 bg-muted rounded mb-1"></div>
            <div className="h-3 w-32 bg-muted rounded"></div>
            <div className="h-3 w-20 bg-muted rounded mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
