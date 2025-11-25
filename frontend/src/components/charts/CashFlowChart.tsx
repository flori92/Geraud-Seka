"use client";

import React, { useState, useEffect } from "react";
import { getCashFlow, type CashFlowData } from "@/lib/api";

interface CashFlowChartProps {
  period: string;
  height?: number;
}

// Représentation simplifiée des flux de trésorerie avec des barres Entrées/Sorties
const CashFlowChart: React.FC<CashFlowChartProps> = ({ period, height = 300 }) => {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCashFlow = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) {
          setError("Vous devez être connecté");
          return;
        }
        const cashFlowData = await getCashFlow(token, period);
        setData(cashFlowData);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch cash flow data", err);
        setError("Impossible de charger les données de trésorerie");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCashFlow();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-3" style={{ minHeight: height }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="w-full bg-gray-100 rounded-full h-3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-red-600" style={{ minHeight: height }}>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-gray-500" style={{ minHeight: height }}>
        Aucune donnée disponible pour cette période
      </div>
    );
  }

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
