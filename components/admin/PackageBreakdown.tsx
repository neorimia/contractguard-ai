// components/admin/PackageBreakdown.tsx
"use client";

interface PackageData {
  oneReport: { count: number; revenue: number };
  threeReports: { count: number; revenue: number };
  fiveReports: { count: number; revenue: number };
}

interface PackageBreakdownProps {
  data: PackageData;
}

export function PackageBreakdown({ data }: PackageBreakdownProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const totalCount =
    data.oneReport.count + data.threeReports.count + data.fiveReports.count;
  const totalRevenue =
    data.oneReport.revenue +
    data.threeReports.revenue +
    data.fiveReports.revenue;

  const packages = [
    {
      name: "1 Report",
      count: data.oneReport.count,
      revenue: data.oneReport.revenue,
      percentage:
        totalCount > 0 ? (data.oneReport.count / totalCount) * 100 : 0,
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "3 Reports",
      count: data.threeReports.count,
      revenue: data.threeReports.revenue,
      percentage:
        totalCount > 0 ? (data.threeReports.count / totalCount) * 100 : 0,
      color: "from-green-500 to-green-600",
      badge: "Most Popular",
    },
    {
      name: "5 Reports",
      count: data.fiveReports.count,
      revenue: data.fiveReports.revenue,
      percentage:
        totalCount > 0 ? (data.fiveReports.count / totalCount) * 100 : 0,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-4">
      {packages.map((pkg, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{pkg.name}</span>
              {pkg.badge && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  {pkg.badge}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold">{pkg.count}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({pkg.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="relative h-8 bg-muted rounded-md overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${pkg.color} transition-all duration-500`}
              style={{ width: `${Math.min(pkg.percentage, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/90">
                {formatCurrency(pkg.revenue)}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Sales</span>
          <span className="text-lg font-semibold">{totalCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Revenue</span>
          <span className="text-lg font-bold">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
        {totalCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Order</span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalRevenue / totalCount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
