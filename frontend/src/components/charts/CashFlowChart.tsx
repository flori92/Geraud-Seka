"use client";

import React from "react";

interface CashFlowChartProps {
  period: string;
  height?: number;
}

// Représentation simplifiée des flux de trésorerie avec des barres Entrées/Sorties
const CashFlowChart: React.FC<CashFlowChartProps> = ({ period, height = 300 }) => {
  const data = [
    { label: "Jan", in: 120000, out: 80000 },
    { label: "Fév", in: 150000, out: 90000 },
    { label: "Mar", in: 130000, out: 95000 },
    { label: "Avr", in: 160000, out: 100000 },
  ];

  const max = Math.max(...data.map((d) => Math.max(d.in, d.out)));

  return (
    <div className="space-y-3" style={{ minHeight: height }}>
      {data.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{row.label}</span>
            <span>
              Entrées: {row.in.toLocaleString("fr-FR")} F / Sorties: {row.out.toLocaleString("fr-FR")} F
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
            <div
              className="h-3 bg-emerald-500"
              style={{ width: `${(row.in / max) * 100}%` }}
            />
            <div
              className="h-3 bg-red-400"
              style={{ width: `${(row.out / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="mt-2 text-[11px] text-gray-400">Période analysée : {period}</p>
    </div>
  );
};

export default CashFlowChart;
