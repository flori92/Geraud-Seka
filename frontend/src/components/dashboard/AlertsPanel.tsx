"use client";

import React from "react";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

interface AlertsPanelProps {
  alerts: AlertItem[];
  onMarkAsRead: (id: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onMarkAsRead }) => {
  if (!alerts || alerts.length === 0) {
    return <p className="text-sm text-gray-500">Aucune alerte récente.</p>;
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start justify-between border rounded-lg px-3 py-2 text-sm ${
            alert.is_read ? "bg-gray-50" : "bg-red-50/30"
          }`}
        >
          <div className="flex items-start space-x-2">
            <AlertTriangleIcon className={`h-4 w-4 mt-0.5 ${severityColor(alert.severity)}`} />
            <div>
              <p className="font-semibold text-gray-900">{alert.title}</p>
              <p className="text-gray-700 text-xs">{alert.message}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(alert.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
          {!alert.is_read && (
            <button
              onClick={() => onMarkAsRead(alert.id)}
              className="ml-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
            >
              <CheckCircle2Icon className="h-3 w-3 mr-1" />
              Marquer comme lue
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
