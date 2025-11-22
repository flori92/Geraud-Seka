"use client";

import React from "react";

interface SalesChartProps {
  period: string;
  height?: number;
}

const SalesChart: React.FC<SalesChartProps> = ({ period, height = 300 }) => {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 text-sm"
      style={{ minHeight: height }}
    >
      <div className="text-center px-4 py-6">
        <p className="font-medium mb-1">Graphique des ventes</p>
        <p className="text-xs text-gray-400">
          Placeholder pour le graphique des ventes (période : {period}).
        </p>
      </div>
    </div>
  );
};

export default SalesChart;
