// components/admin/DateRangePicker.tsx
"use client";

interface DateRangePickerProps {
  period: string;
  onPeriodChange: (period: string) => void;
}

export function DateRangePicker({
  period,
  onPeriodChange,
}: DateRangePickerProps) {
  const periods = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="period-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Period:
      </label>
      <select
        id="period-select"
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="px-4 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {periods.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
