import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Lock, Unlock } from "lucide-react";

type Period = {
  id: string;
  label: string;
  is_closed: boolean;
};

export default function PeriodValidationPage() {
  const [periods, setPeriods] = useState<Period[]>(
    useMemo(
      () => [
        { id: "2025-01", label: "Janvier 2025", is_closed: false },
        { id: "2024-12", label: "Décembre 2024", is_closed: true },
      ],
      []
    )
  );

  const toggle = (id: string) => {
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, is_closed: !p.is_closed } : p)));
  };

  return (
    <DashboardLayout title="Validation période">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Validation période</h1>
        <p className="text-sm text-gray-500 mt-1">Clôturer / réouvrir une période comptable</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
          <div>Période</div>
          <div>Statut</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-100">
          {periods.map((p) => (
            <div key={p.id} className="grid grid-cols-3 px-4 py-3 text-sm items-center">
              <div className="text-gray-900">{p.label}</div>
              <div className="text-gray-700">{p.is_closed ? "Clôturée" : "Ouverte"}</div>
              <div className="text-right">
                <Button
                  variant="secondary"
                  onClick={() => toggle(p.id)}
                  className="inline-flex items-center gap-2"
                >
                  {p.is_closed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {p.is_closed ? "Réouvrir" : "Clôturer"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
