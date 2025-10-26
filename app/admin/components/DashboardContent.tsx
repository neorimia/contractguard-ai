// components/admin/DashboardContent.tsx
"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { RevenueChart } from "./RevenueChart";
import { ConversionFunnel } from "./ConversionFunnel";
import { DateRangePicker } from "./DateRangePicker";
import { PackageBreakdown } from "./PackageBreakdown";
import type {
  RevenueStats,
  ConversionFunnel as ConversionFunnelType,
} from "@/lib/services/analytics.service";

export function DashboardContent() {
  const [period, setPeriod] = useState<string>("30d");
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [funnelData, setFunnelData] = useState<ConversionFunnelType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch revenue stats
        const revenueResponse = await fetch(
          `/api/admin/revenue-stats?period=${period}`
        );
        if (!revenueResponse.ok) {
          throw new Error("Failed to fetch revenue stats");
        }
        const revenueData = await revenueResponse.json();
        setRevenueStats(revenueData);

        // Fetch conversion funnel
        const funnelResponse = await fetch(
          `/api/admin/conversion-funnel?period=${period}`
        );
        if (!funnelResponse.ok) {
          throw new Error("Failed to fetch conversion funnel");
        }
        const funnelData = await funnelResponse.json();
        setFunnelData(funnelData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!revenueStats || !funnelData) {
    return <div className="text-center py-12">No data available</div>;
  }

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Calculate total revenue
  const totalRevenue = revenueStats.combined.totalRevenue;
  const mrr = revenueStats.subscriptions.mrr;
  const instantRevenue = revenueStats.instant.totalRevenue;
  const revenueGrowth =
    revenueStats.period.previousPeriodComparison.revenueGrowth;

  return (
    <div className="space-y-8">
      {/* Date Range Picker */}
      <div className="flex justify-end">
        <DateRangePicker period={period} onPeriodChange={setPeriod} />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={`${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`}
          trend={revenueGrowth >= 0 ? "up" : "down"}
          icon="💰"
          description={`Last ${period === "7d" ? "7 days" : period === "30d" ? "30 days" : period === "90d" ? "90 days" : "year"}`}
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(mrr)}
          change={`${revenueStats.subscriptions.newThisMonth} new`}
          trend="up"
          icon="📈"
          description="Monthly recurring revenue"
        />
        <MetricCard
          title="Instant Sales"
          value={revenueStats.instant.totalSales.toString()}
          change={formatCurrency(instantRevenue)}
          trend="up"
          icon="⚡"
          description="One-time purchases"
        />
        <MetricCard
          title="Active Subs"
          value={(
            revenueStats.subscriptions.activePro +
            revenueStats.subscriptions.activeTeam
          ).toString()}
          change={`${revenueStats.subscriptions.churnRate.toFixed(1)}% churn`}
          trend={revenueStats.subscriptions.churnRate < 5 ? "up" : "down"}
          icon="👥"
          description="Pro + Team subscribers"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-semibold mb-4">Revenue Trend</h2>
        <RevenueChart period={period} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Funnel */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
          <ConversionFunnel data={funnelData} />
        </div>

        {/* Package Breakdown */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Package Breakdown</h2>
          <PackageBreakdown data={revenueStats.instant.packageBreakdown} />
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-muted-foreground">Pro Plan</h3>
            <span className="text-2xl">💎</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {revenueStats.subscriptions.activePro}
          </p>
          <p className="text-sm text-muted-foreground">Active subscriptions</p>
          <p className="text-sm text-green-600 mt-2">
            +{revenueStats.subscriptions.newThisMonth} this period
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-muted-foreground">Team Plan</h3>
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {revenueStats.subscriptions.activeTeam}
          </p>
          <p className="text-sm text-muted-foreground">Active subscriptions</p>
          <p className="text-sm font-medium mt-2">
            {formatCurrency(revenueStats.subscriptions.activeTeam * 9900)}/mo
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-muted-foreground">Churn Rate</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {revenueStats.subscriptions.churnRate.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            Last {period === "30d" ? "30 days" : "period"}
          </p>
          <p className="text-sm text-red-600 mt-2">
            {revenueStats.subscriptions.canceledThisMonth} canceled
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Instant Sales</span>
              <span className="font-semibold">
                {formatCurrency(instantRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subscriptions (MRR)</span>
              <span className="font-semibold">{formatCurrency(mrr)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-bold text-lg">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg Order Value</span>
              <span className="font-semibold">
                {formatCurrency(revenueStats.instant.averageOrderValue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Blended ARPU</span>
              <span className="font-semibold">
                {formatCurrency(revenueStats.combined.blendedARPU)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Customer LTV</span>
              <span className="font-semibold">
                {formatCurrency(revenueStats.combined.ltv)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
