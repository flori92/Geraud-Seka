"use client";

import React from "react";

interface ConversionFunnelProps {
  period: string;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ period }) => {
  const steps = [
    { label: "Leads", value: 100 },
    { label: "Qualifiés", value: 60 },
    { label: "Opportunités", value: 35 },
    { label: "Devis envoyés", value: 20 },
    { label: "Clients gagnés", value: 10 },
  ];

  const max = steps[0]?.value || 1;

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.label} className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{step.label}</span>
            <span>{step.value}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-blue-500 rounded-full"
              style={{ width: `${(step.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="mt-2 text-[11px] text-gray-400">
        Période analysée : {period}
      </p>
    </div>
  );
};
