import { useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";

type ClosingAction = {
  title: string;
  description: string;
  href: string;
};

export default function ClosingEntriesPage() {
  const actions = useMemo<ClosingAction[]>(
    () => [
      { title: "Contrôles de cohérence", description: "Vérifications avant clôture", href: "/accounting/consistency-checks" },
      { title: "Provisions", description: "Constituer / reprendre", href: "/accounting/provisions" },
      { title: "Amortissements", description: "Immobilisations", href: "/accounting/depreciations" },
      { title: "Inventaire", description: "Inventaire comptable", href: "/accounting/inventory" },
      { title: "Validation période", description: "Geler une période", href: "/accounting/period-validation" },
    ],
    []
  );

  return (
    <DashboardLayout title="Écritures de clôture">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Écritures de clôture</h1>
        <p className="text-sm text-gray-500 mt-1">Checklist de fin de période</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((a) => (
          <Link key={a.title} href={a.href} className="block">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="font-medium text-gray-900">{a.title}</div>
              <div className="text-sm text-gray-500 mt-1">{a.description}</div>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
