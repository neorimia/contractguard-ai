"use client";

/**
 * Liquidity Timeline Chart Component
 *
 * Visualizes liquidity changes over time.
 * Detects liquidity removal events and lock expirations.
 */

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card } from "@/components/ui/card";

interface LiquidityEvent {
  timestamp: string;
  liquidityUsd: number;
  change?: number;
  changePercentage?: number;
  eventType?: "add" | "remove" | "lock" | "unlock";
}

interface LiquidityTimelineChartProps {
  events: LiquidityEvent[];
  currentLiquidity: number;
  lockExpiration?: string;
  className?: string;
}

export function LiquidityTimelineChart({
  events,
  currentLiquidity,
  lockExpiration,
  className,
}: LiquidityTimelineChartProps) {
  // Sort events by timestamp
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Prepare chart data
  const chartData = sortedEvents.map((event) => ({
    time: new Date(event.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    liquidity: event.liquidityUsd,
    change: event.change || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const event = sortedEvents.find(
        (e) =>
          new Date(e.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }) === data.time
      );

      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium">{data.time}</p>
          <p className="text-cyan-400 text-sm">
            ${payload[0].value.toLocaleString()} USD
          </p>
          {event?.change && (
            <p
              className={`text-sm mt-1 ${event.change > 0 ? "text-green-500" : "text-red-500"}`}
            >
              {event.change > 0 ? "+" : ""}
              {event.changePercentage?.toFixed(1)}%
              {event.eventType && ` (${event.eventType})`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate liquidity trend
  const calculateTrend = () => {
    if (sortedEvents.length < 2) return { direction: "stable", percentage: 0 };

    const first = sortedEvents[0].liquidityUsd;
    const last = sortedEvents[sortedEvents.length - 1].liquidityUsd;
    const percentage = ((last - first) / first) * 100;

    if (percentage > 10) return { direction: "increasing", percentage };
    if (percentage < -10) return { direction: "decreasing", percentage };
    return { direction: "stable", percentage };
  };

  const trend = calculateTrend();

  // Detect significant removal events
  const removalEvents = sortedEvents.filter(
    (e) => e.eventType === "remove" && Math.abs(e.changePercentage || 0) > 20
  );

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Liquidity Timeline
          </h3>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Current Liquidity: </span>
              <span className="font-bold text-white">
                ${currentLiquidity.toLocaleString()} USD
              </span>
            </div>
            <div>
              <span className="text-gray-400">Trend: </span>
              <span
                className={`font-bold ${
                  trend.direction === "increasing"
                    ? "text-green-500"
                    : trend.direction === "decreasing"
                      ? "text-red-500"
                      : "text-gray-400"
                }`}
              >
                {trend.direction === "increasing" && "↗"}
                {trend.direction === "decreasing" && "↘"}
                {trend.direction === "stable" && "→"}{" "}
                {Math.abs(trend.percentage).toFixed(1)}%
              </span>
            </div>
            {lockExpiration && (
              <div>
                <span className="text-gray-400">Lock Expires: </span>
                <span className="font-bold text-cyan-400">
                  {new Date(lockExpiration).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="liquidityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              label={{
                value: "Liquidity (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "#9ca3af",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="liquidity"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#liquidityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Events Timeline */}
        {sortedEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Recent Events
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sortedEvents
                .slice(-5)
                .reverse()
                .map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          event.eventType === "add"
                            ? "bg-green-500"
                            : event.eventType === "remove"
                              ? "bg-red-500"
                              : event.eventType === "lock"
                                ? "bg-blue-500"
                                : event.eventType === "unlock"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm text-gray-400">
                        {new Date(event.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {event.eventType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                          {event.eventType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {event.change && (
                        <span
                          className={`text-sm font-medium ${
                            event.change > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {event.change > 0 ? "+" : ""}
                          {event.changePercentage?.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-sm text-white">
                        ${event.liquidityUsd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {removalEvents.length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-red-500 font-medium text-sm">
                  Liquidity Removal Detected
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {removalEvents.length} significant removal event(s) detected.
                  The largest removal was{" "}
                  {Math.max(
                    ...removalEvents.map((e) =>
                      Math.abs(e.changePercentage || 0)
                    )
                  ).toFixed(1)}
                  % of liquidity.
                </p>
              </div>
            </div>
          </div>
        )}

        {lockExpiration && new Date(lockExpiration) < new Date() && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-orange-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-orange-500 font-medium text-sm">
                  Liquidity Lock Expired
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  The liquidity lock has expired. Liquidity can now be removed
                  at any time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
