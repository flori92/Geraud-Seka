import { DashboardLayout } from "@/components/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Clients</h2>
          <p className="mt-2 text-xs text-slate-600">
            Liste des dossiers clients, volumes de pièces reçues, échéances clés.
          </p>
          <div className="mt-4 space-y-1 text-xs text-slate-700">
            <p>- 12 clients actifs</p>
            <p>- 4 dossiers en attente de pièces</p>
            <p>- 3 relances planifiées cette semaine</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Tâches & relances</h2>
          <p className="mt-2 text-xs text-slate-600">
            Rappels pour récupérer les pièces, valider les écritures, envoyer les déclarations.
          </p>
          <div className="mt-4 space-y-1 text-xs text-slate-700">
            <p>- 6 tâches en retard</p>
            <p>- 9 tâches à faire cette semaine</p>
            <p>- 2 campagnes d’emails programmées</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Documents & pièces</h2>
          <p className="mt-2 text-xs text-slate-600">
            Suivi des pièces manquantes, documents validés, archivage R2.
          </p>
          <div className="mt-4 space-y-1 text-xs text-slate-700">
            <p>- 32 pièces reçues ce mois-ci</p>
            <p>- 8 pièces manquantes</p>
            <p>- 1200 documents archivés</p>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Prochaines étapes produit</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Brancher ce dashboard sur les vraies données (API SEKA).</li>
          <li>Gérer les rôles (cabinet, collaborateur, client) et les espaces associés.</li>
          <li>Ajouter des filtres par période / statut et un reporting simple.</li>
        </ul>
      </section>
    </DashboardLayout>
  );
}
