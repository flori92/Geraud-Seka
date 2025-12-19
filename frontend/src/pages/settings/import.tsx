import { useRouter } from "next/router";
import Head from "next/head";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
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
    <>
      <Head>
        <title>Imports - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <FileUp className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Imports</h1>
                <p className="text-sm text-gray-600 mt-0.5">Centralisez vos imports de données</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 max-w-3xl">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.title} onClick={() => router.push(item.href)}
                    className="w-full text-left px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 mt-0.5">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
