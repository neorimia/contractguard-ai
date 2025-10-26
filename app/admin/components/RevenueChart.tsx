// components/admin/RevenueChart.tsx
"use client";

interface RevenueChartProps {
  period: string;
}

export function RevenueChart({ period }: RevenueChartProps) {
  // Placeholder for chart visualization
  // TODO: Integrate with Recharts or similar library

  return (
    <div className="relative h-64 flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-muted-foreground">
          Revenue Chart
        </p>
        <p className="text-sm text-muted-foreground">
          Period:{" "}
          {period === "7d"
            ? "Last 7 days"
            : period === "30d"
              ? "Last 30 days"
              : period === "90d"
                ? "Last 90 days"
                : "Last year"}
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Chart visualization coming soon
          <br />
          (Install recharts: npm install recharts)
        </p>
      </div>
    </div>
  );
}

// Example implementation with Recharts (commented out for now):
/*
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  period: string;
}

export function RevenueChart({ period }: RevenueChartProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch daily revenue data
    // This would need a new API endpoint that returns time-series data
    async function fetchChartData() {
      try {
        const response = await fetch(`/api/admin/revenue-chart?period=${period}`);
        const chartData = await response.json();
        setData(chartData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [period]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => `$${(value as number / 100).toFixed(2)}`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="instant"
          stroke="#8884d8"
          name="Instant Sales"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="subscription"
          stroke="#82ca9d"
          name="Subscriptions"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
*/
