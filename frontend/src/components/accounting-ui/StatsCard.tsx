import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = typeof change?.value === "number" && change.value >= 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-2 mt-3">
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-status-success" : "text-status-danger"
            )}
          >
            {isPositive ? "+" : ""}{change.value}%
          </span>
          <span className="text-sm text-neutral-500">{change.label}</span>
        </div>
      )}
    </div>
  );
}
