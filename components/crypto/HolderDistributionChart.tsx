"use client";

/**
 * Holder Distribution Chart Component
 *
 * Visualizes token holder distribution using pie and bar charts.
 * Shows concentration risk at a glance.
 */

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface HolderData {
  address: string;
  balance: string;
  percentage: number;
}

interface HolderDistributionChartProps {
  holders: HolderData[];
  totalSupply?: string;
  className?: string;
}

const COLORS = [
  "#ef4444", // red-500 (highest risk)
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
];

export function HolderDistributionChart({
  holders,
  totalSupply,
  className,
}: HolderDistributionChartProps) {
  // Take top 10 holders
  const topHolders = holders.slice(0, 10);

  // Calculate "Others" percentage
  const top10Percentage = topHolders.reduce((sum, h) => sum + h.percentage, 0);
  const othersPercentage = Math.max(0, 100 - top10Percentage);

  // Prepare pie chart data
  const pieData = [
    ...topHolders.map((h, idx) => ({
      name: `Holder ${idx + 1}`,
      value: h.percentage,
      address: h.address,
    })),
    ...(othersPercentage > 0
      ? [
          {
            name: "Others",
            value: othersPercentage,
            address: "Multiple addresses",
          },
        ]
      : []),
  ];

  // Prepare bar chart data
  const barData = topHolders.map((h, idx) => ({
    name: `#${idx + 1}`,
    percentage: h.percentage,
    address: `${h.address.slice(0, 6)}...${h.address.slice(-4)}`,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-cyan-400">{payload[0].value.toFixed(2)}%</p>
          {payload[0].payload.address && (
            <p className="text-gray-400 text-xs mt-1 font-mono">
              {payload[0].payload.address}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Determine concentration risk level
  const getConcentrationRisk = (percentage: number) => {
    if (percentage > 75) return { level: "Critical", color: "text-red-500" };
    if (percentage > 50) return { level: "High", color: "text-orange-500" };
    if (percentage > 30) return { level: "Medium", color: "text-yellow-500" };
    return { level: "Low", color: "text-green-500" };
  };

  const concentrationRisk = getConcentrationRisk(top10Percentage);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Token Holder Distribution
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-400">Top 10 Holdings: </span>
              <span className={`font-bold ${concentrationRisk.color}`}>
                {top10Percentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Risk Level: </span>
              <span className={`font-bold ${concentrationRisk.color}`}>
                {concentrationRisk.level}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Distribution Overview
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Top 10 Holders
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af" }}
                  label={{
                    value: "Holdings (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#9ca3af",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holder List */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Top Holders Details
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {topHolders.map((holder, idx) => (
              <div
                key={holder.address}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-400">#{idx + 1}</span>
                  <code className="text-sm text-cyan-400 font-mono">
                    {holder.address.slice(0, 8)}...{holder.address.slice(-6)}
                  </code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {holder.percentage.toFixed(2)}%
                  </span>
                  <span className="text-sm text-white font-medium">
                    {parseFloat(holder.balance).toLocaleString()} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning if high concentration */}
        {top10Percentage > 50 && (
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
                  High Concentration Risk
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Top 10 holders control {top10Percentage.toFixed(1)}% of the
                  supply. This creates significant dump risk if large holders
                  sell.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
