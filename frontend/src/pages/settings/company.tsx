/**
 * Informations entreprise - Style Pennylane
 * Gestion complète des informations de l'entreprise
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, Save, Upload, RefreshCw } from "lucide-react";
import Link from "next/link";

type TabType = "general" | "comptable" | "fiscal" | "capital" | "filiales" | "risques" | "actions";

interface CompanyInfo {
  // Général
  raisonSociale: string;
  nomCommercial: string;
  siren: string;
  capitalSocial: number;
  formeJuridique: string;
  numeroTva: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  dateCreation: string;
  activite: string;
  // Personnalisation
  couleurDocuments: string;
  logoUrl: string;
  // Tenue comptable
  regimeComptable: string;
  exerciceDebut: string;
  exerciceFin: string;
  planComptable: string;
  // Fiscal
  regimeTva: string;
  regimeImposition: string;
  cfe: string;
  // Capital
  capitalLibere: number;
  nombreActions: number;
  valeurNominale: number;
}

const defaultInfo: CompanyInfo = {
  raisonSociale: "",
  nomCommercial: "",
  siren: "",
  capitalSocial: 0,
  formeJuridique: "",
  numeroTva: "",
  adresse: "",
  codePostal: "",
  ville: "",
  pays: "Côte d'Ivoire",
  dateCreation: "",
  activite: "",
  couleurDocuments: "#1e3a5f",
  logoUrl: "",
  regimeComptable: "reel_normal",
  exerciceDebut: "01/01",
  exerciceFin: "31/12",
  planComptable: "SYSCOHADA",
  regimeTva: "reel",
  regimeImposition: "is",
  cfe: "",
  capitalLibere: 0,
  nombreActions: 0,
  valeurNominale: 0,
};

const formesJuridiques = [
  { value: "", label: "Choisir..." },
  { value: "sarl", label: "SARL - Société à Responsabilité Limitée" },
  { value: "sa", label: "SA - Société Anonyme" },
  { value: "sas", label: "SAS - Société par Actions Simplifiée" },
  { value: "snc", label: "SNC - Société en Nom Collectif" },
  { value: "ei", label: "EI - Entreprise Individuelle" },
  { value: "gie", label: "GIE - Groupement d'Intérêt Économique" },
  { value: "association", label: "Association" },
  { value: "autre", label: "Autre" },
];

const regimesComptables = [
  { value: "reel_normal", label: "Réel normal" },
  { value: "reel_simplifie", label: "Réel simplifié" },
  { value: "micro", label: "Micro-entreprise" },
];

const regimesTva = [
  { value: "reel", label: "Réel normal" },
  { value: "simplifie", label: "Simplifié" },
  { value: "franchise", label: "Franchise en base" },
  { value: "exonere", label: "Exonéré" },
];

const regimesImposition = [
  { value: "is", label: "Impôt sur les Sociétés (IS)" },
  { value: "ir", label: "Impôt sur le Revenu (IR)" },
  { value: "micro", label: "Micro-BIC / Micro-BNC" },
];

export default function CompanySettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [info, setInfo] = useState<CompanyInfo>(defaultInfo);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const savedInfo = localStorage.getItem("seka_company_info");
    if (savedInfo) {
      setInfo(JSON.parse(savedInfo));
    }
  }, [router]);

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem("seka_company_info", JSON.stringify(info));
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "general", label: "Général" },
    { id: "comptable", label: "Tenue comptable" },
    { id: "fiscal", label: "Fiscal" },
    { id: "capital", label: "Répartition du capital" },
    { id: "filiales", label: "Filiales et participations" },
    { id: "risques", label: "Évaluation des risques" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <>
      <Head>
        <title>Informations entreprise - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Retour aux paramètres
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Informations entreprise</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Vérifiez et mettez à jour les informations clés de l&apos;entreprise pour sa gestion et sa comptabilité.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Tab: Général */}
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-6">Informations</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
                  <input
                    type="text"
                    value={info.raisonSociale}
                    onChange={(e) => setInfo({ ...info, raisonSociale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom commercial</label>
                  <input
                    type="text"
                    value={info.nomCommercial}
                    onChange={(e) => setInfo({ ...info, nomCommercial: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
                  <input
                    type="text"
                    value={info.siren}
                    onChange={(e) => setInfo({ ...info, siren: e.target.value })}
                    placeholder="Ex: 123456789"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capital social</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={info.capitalSocial}
                      onChange={(e) => setInfo({ ...info, capitalSocial: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
                  <select
                    value={info.formeJuridique}
                    onChange={(e) => setInfo({ ...info, formeJuridique: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {formesJuridiques.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de TVA</label>
                  <input
                    type="text"
                    value={info.numeroTva}
                    onChange={(e) => setInfo({ ...info, numeroTva: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={info.adresse}
                      onChange={(e) => setInfo({ ...info, adresse: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                    <input
                      type="text"
                      value={info.codePostal}
                      onChange={(e) => setInfo({ ...info, codePostal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input
                      type="text"
                      value={info.ville}
                      onChange={(e) => setInfo({ ...info, ville: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <input
                      type="text"
                      value={info.pays}
                      onChange={(e) => setInfo({ ...info, pays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                  <input
                    type="date"
                    value={info.dateCreation}
                    onChange={(e) => setInfo({ ...info, dateCreation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activité de l&apos;entreprise</label>
                  <textarea
                    value={info.activite}
                    onChange={(e) => setInfo({ ...info, activite: e.target.value })}
                    placeholder="Précisez l'activité en quelques mots"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur sur tous les documents</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={info.couleurDocuments}
                      onChange={(e) => setInfo({ ...info, couleurDocuments: e.target.value })}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={info.couleurDocuments}
                      onChange={(e) => setInfo({ ...info, couleurDocuments: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo sur tous les documents</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      Choisir un logo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      ou le glisser et le déposer ici
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Formats acceptés : PNG, JPG, JPEG, BMP<br />
                      Taille maximale : 2000 × 2000 px<br />
                      Poids maximal : 2 Mo
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" />
                  Mettre à jour les informations
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    saved 
                      ? "bg-green-600 text-white" 
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Tenue comptable */}
          {activeTab === "comptable" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-6">Paramètres comptables</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régime comptable</label>
                  <select
                    value={info.regimeComptable}
                    onChange={(e) => setInfo({ ...info, regimeComptable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {regimesComptables.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Début exercice</label>
                    <input
                      type="text"
                      value={info.exerciceDebut}
                      onChange={(e) => setInfo({ ...info, exerciceDebut: e.target.value })}
                      placeholder="JJ/MM"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin exercice</label>
                    <input
                      type="text"
                      value={info.exerciceFin}
                      onChange={(e) => setInfo({ ...info, exerciceFin: e.target.value })}
                      placeholder="JJ/MM"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan comptable</label>
                  <select
                    value={info.planComptable}
                    onChange={(e) => setInfo({ ...info, planComptable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="SYSCOHADA">SYSCOHADA (Afrique)</option>
                    <option value="PCG">PCG (France)</option>
                    <option value="IFRS">IFRS</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Tab: Fiscal */}
          {activeTab === "fiscal" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-6">Paramètres fiscaux</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régime de TVA</label>
                  <select
                    value={info.regimeTva}
                    onChange={(e) => setInfo({ ...info, regimeTva: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {regimesTva.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régime d&apos;imposition</label>
                  <select
                    value={info.regimeImposition}
                    onChange={(e) => setInfo({ ...info, regimeImposition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {regimesImposition.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Centre des impôts (CFE)</label>
                  <input
                    type="text"
                    value={info.cfe}
                    onChange={(e) => setInfo({ ...info, cfe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Tab: Capital */}
          {activeTab === "capital" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-6">Répartition du capital</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capital libéré</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={info.capitalLibere}
                      onChange={(e) => setInfo({ ...info, capitalLibere: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d&apos;actions / parts</label>
                  <input
                    type="number"
                    value={info.nombreActions}
                    onChange={(e) => setInfo({ ...info, nombreActions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur nominale</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={info.valeurNominale}
                      onChange={(e) => setInfo({ ...info, valeurNominale: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  La liste des associés et la répartition détaillée du capital peuvent être gérées dans un module dédié.
                </p>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Tab: Filiales */}
          {activeTab === "filiales" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">Filiales et participations</h2>
              <p className="text-sm text-gray-500 mb-6">
                Gérez les filiales et participations de votre entreprise.
              </p>
              
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">Aucune filiale enregistrée</p>
                <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                  + Ajouter une filiale
                </button>
              </div>
            </div>
          )}

          {/* Tab: Risques */}
          {activeTab === "risques" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">Évaluation des risques</h2>
              <p className="text-sm text-gray-500 mb-6">
                Documentez l&apos;évaluation des risques de votre entreprise.
              </p>
              
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">Aucune évaluation enregistrée</p>
                <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                  + Créer une évaluation
                </button>
              </div>
            </div>
          )}

          {/* Tab: Actions */}
          {activeTab === "actions" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">Actions</h2>
              <p className="text-sm text-gray-500 mb-6">
                Actions rapides pour la gestion de l&apos;entreprise.
              </p>
              
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-gray-900 text-sm">Générer un extrait Kbis</p>
                  <p className="text-xs text-gray-500">Télécharger les informations légales</p>
                </button>
                <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-gray-900 text-sm">Exporter les statuts</p>
                  <p className="text-xs text-gray-500">Document PDF des statuts de la société</p>
                </button>
                <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-gray-900 text-sm">Clôturer l&apos;exercice</p>
                  <p className="text-xs text-gray-500">Lancer la procédure de clôture</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
