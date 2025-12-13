import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";

export default function AnnexesPage() {
  const items = [
    { title: "Annexes - Immobilisations", href: "/accounting/depreciations" },
    { title: "Annexes - Provisions", href: "/accounting/provisions" },
    { title: "Annexes - Inventaire", href: "/accounting/inventory" },
  ];

  return (
    <DashboardLayout title="Annexes">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Annexes</h1>
        <p className="text-sm text-gray-500 mt-1">Documents et tableaux complémentaires</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item.title} href={item.href} className="block">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="font-medium text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-500 mt-1">Accéder</div>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
