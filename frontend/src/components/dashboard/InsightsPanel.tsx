"use client";

import React from "react";

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  priority: string;
  confidence_score: number;
  recommendations: string[];
}

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return <p className="text-sm text-gray-500">Aucun insight disponible pour l'instant.</p>;
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className="border border-gray-200 rounded-lg p-4 flex flex-col space-y-2 hover:border-blue-200 transition"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
              {insight.insight_type}
            </span>
          </div>
          <p className="text-sm text-gray-700">{insight.description}</p>
          {insight.recommendations && insight.recommendations.length > 0 && (
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 mt-1">
              {insight.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Priorité : {insight.priority}</span>
            <span>Confiance : {(insight.confidence_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};
