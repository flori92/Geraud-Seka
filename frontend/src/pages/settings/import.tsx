import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { ChevronRight, FileUp, Landmark } from "lucide-react";

export default function ImportSettingsPage() {
  const router = useRouter();

  const items = [
    {
      title: "Relevés bancaires",
      description: "Importer des relevés pour alimenter les transactions et faciliter le rapprochement.",
      href: "/accounting/import-statements",
      icon: Landmark,
    },
  ];

  return (
    <DashboardLayout title="Imports">
      <div className="max-w-3xl">
        <Card className="overflow-hidden">
          <div className="px-6 py-5 border-b border-accents-2 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accents-1">
              <FileUp className="h-5 w-5 text-accents-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Imports</h1>
              <p className="text-sm text-accents-6">Centralisez vos imports de données.</p>
            </div>
          </div>

          <div className="divide-y divide-accents-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => router.push(item.href)}
                  className="w-full text-left px-6 py-5 hover:bg-accents-1 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accents-1 mt-0.5">
                        <Icon className="h-5 w-5 text-accents-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.title}</div>
                        <div className="text-sm text-accents-6 mt-1">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-accents-5 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
