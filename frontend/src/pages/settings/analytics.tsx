/**
 * Page Familles Analytiques - SEKA
 * Configuration des centres de coûts et axes analytiques
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

interface AnalyticsFamily {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

const defaultFamilies: AnalyticsFamily[] = [
  { id: "1", code: "ADMIN", name: "Administration", description: "Frais administratifs généraux", color: "#3b82f6", isActive: true },
  { id: "2", code: "COMM", name: "Commercial", description: "Frais commerciaux et marketing", color: "#10b981", isActive: true },
  { id: "3", code: "PROD", name: "Production", description: "Coûts de production", color: "#f59e0b", isActive: true },
  { id: "4", code: "RH", name: "Ressources Humaines", description: "Frais de personnel", color: "#8b5cf6", isActive: true },
];

export default function AnalyticsSettingsPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<AnalyticsFamily[]>(defaultFamilies);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFamily, setNewFamily] = useState({ code: "", name: "", description: "", color: "#3b82f6" });

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const filteredFamilies = families.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFamily = () => {
    if (!newFamily.code || !newFamily.name) return;
    
    const family: AnalyticsFamily = {
      id: Date.now().toString(),
      ...newFamily,
      isActive: true,
    };
    setFamilies([...families, family]);
    setNewFamily({ code: "", name: "", description: "", color: "#3b82f6" });
    setShowAddModal(false);
  };

  const handleDeleteFamily = (id: string) => {
    setFamilies(families.filter((f) => f.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setFamilies(
      families.map((f) =>
        f.id === id ? { ...f, isActive: !f.isActive } : f
      )
    );
  };

  return (
    <>
      <Head>
        <title>Familles analytiques - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Familles analytiques</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Configurez vos centres de coûts et axes d&apos;analyse
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nouvelle famille
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une famille..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      Aucune famille analytique trouvée
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((family) => (
                    <tr key={family.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: family.color }}
                          />
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {family.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{family.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{family.description}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(family.id)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            family.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {family.isActive ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => console.log("Edit:", family.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFamily(family.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">À quoi servent les familles analytiques ?</h3>
                <p className="text-xs text-blue-700 mt-1">
                  Les familles analytiques permettent de catégoriser vos dépenses et revenus par centre de coûts.
                  Vous pouvez ensuite analyser la rentabilité de chaque département, projet ou activité.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Ajout */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Nouvelle famille</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={newFamily.code}
                    onChange={(e) => setNewFamily({ ...newFamily, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: ADMIN"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newFamily.name}
                    onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
                    placeholder="Ex: Administration"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newFamily.description}
                    onChange={(e) => setNewFamily({ ...newFamily, description: e.target.value })}
                    placeholder="Ex: Frais administratifs généraux"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <input
                    type="color"
                    value={newFamily.color}
                    onChange={(e) => setNewFamily({ ...newFamily, color: e.target.value })}
                    className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddFamily}
                  disabled={!newFamily.code || !newFamily.name}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
