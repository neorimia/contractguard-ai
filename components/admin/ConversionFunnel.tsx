// components/admin/ConversionFunnel.tsx
"use client";

import type { ConversionFunnel as ConversionFunnelType } from "@/lib/services/analytics.service";

interface ConversionFunnelProps {
  data: ConversionFunnelType;
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const funnelSteps = [
    {
      label: "Report Views",
      value: data.reportViews,
      percentage: 100,
    },
    {
      label: "Checkout Initiated",
      value: data.checkoutInitiated,
      percentage:
        data.reportViews > 0
          ? (data.checkoutInitiated / data.reportViews) * 100
          : 0,
    },
    {
      label: "Instant Purchases",
      value: data.instantPurchases,
      percentage: data.instantConversionRate,
    },
    {
      label: "Subscriptions",
      value: data.subscriptionPurchases,
      percentage: data.subscriptionConversionRate,
    },
  ];

  return (
    <div className="space-y-4">
      {funnelSteps.map((step, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{step.label}</span>
            <div className="text-right">
              <span className="text-lg font-semibold">{step.value}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({step.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="relative h-8 bg-muted rounded-md overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(step.percentage, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/90">
                {step.value} conversions
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Conversion Rates Summary */}
      <div className="mt-6 pt-6 border-t space-y-2">
        <h4 className="font-semibold text-sm mb-3">Conversion Rates</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Instant</p>
            <p className="text-lg font-semibold">
              {data.instantConversionRate.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subscription</p>
            <p className="text-lg font-semibold">
              {data.subscriptionConversionRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
