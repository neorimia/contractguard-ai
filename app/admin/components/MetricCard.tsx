// components/admin/MetricCard.tsx
"use client";

import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
  description?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
}: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center text-sm font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            {change}
          </span>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
