import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { getCurrentUser, User } from "@/lib/api";
import { User as UserIcon, Building2, Bell, Lock, Palette, CreditCard, Shield, Save, ChevronRight, Settings as SettingsIcon, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const tabFromQuery = typeof router.query.tab === "string" ? router.query.tab : null;
  const isHub = !tabFromQuery;

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { if (tabFromQuery) setActiveTab(tabFromQuery); }, [tabFromQuery]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) { router.push("/login"); return; }
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch { setError("Erreur lors du chargement du profil"); } finally { setLoading(false); }
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: UserIcon },
    { id: "company", label: "Entreprise", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "billing", label: "Facturation", icon: CreditCard },
    { id: "preferences", label: "Préférences", icon: Palette },
  ];

  const hubSections = [
    {
      title: "Paramètres", items: [
        { label: "Connexions bancaires", href: "/treasury/accounts" },
        { label: "Transmission de factures", href: "/accounting/import-statements" },
        { label: "Facturation client", href: "/ventes/factures-clients" },
        { label: "Centre de règles", href: "/settings/rules" },
        { label: "Connectivité", href: "/settings/integrations" },
        { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
      ]
    },
    {
      title: "", items: [
        { label: "Informations entreprise", href: "/settings?tab=company" },
        { label: "Gestion de l&apos;équipe", href: "/settings/team" },
        { label: "Gestion d&apos;abonnement", href: "/billing" },
      ]
    },
    {
      title: "Historique", items: [
        { label: "Imports", href: "/settings/import" },
        { label: "Exports", href: "/exports" },
      ]
    }
  ];

  const handleSave = () => { setSuccess("Paramètres sauvegardés avec succès"); setTimeout(() => setSuccess(null), 3000); };

  if (loading) {
    return (
      <>
        <Head><title>Paramètres - SEKA</title></Head>
        <div className="min-h-screen bg-gray-50">
          <PennylaneSidebar />
          <main className="ml-[220px] flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Paramètres - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100"><SettingsIcon className="h-5 w-5 text-gray-600" /></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
                <p className="text-sm text-gray-600 mt-0.5">Configuration de votre compte</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

            {isHub ? (
              <div className="max-w-3xl">
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {hubSections.map((section, sectionIdx) => (
                    <div key={sectionIdx}>
                      {section.title && <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{section.title}</div>}
                      <div className="divide-y divide-gray-200">
                        {section.items.map((item, idx) => (
                          <button key={idx} onClick={() => router.push(item.href)} className="w-full flex items-center justify-between px-6 py-4 text-sm text-gray-900 hover:bg-gray-50 transition-colors">
                            <span className="font-medium">{item.label}</span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-6">
                <div className="w-64 flex-shrink-0">
                  <div className="bg-white rounded-lg border border-gray-200 p-2">
                    <nav className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button key={tab.id} onClick={() => router.push(`/settings?tab=${tab.id}`)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-[#1e3a5f] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                            <Icon className="h-4 w-4" />{tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                <div className="flex-1">
                  {activeTab === "profile" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h2>
                      <div className="space-y-4 max-w-md">
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                          <input type="text" defaultValue={user?.full_name || ""} placeholder="Votre nom complet" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input type="email" defaultValue={user?.email || ""} placeholder="email@exemple.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                          <input type="tel" placeholder="+229 XX XX XX XX" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                          <input type="text" defaultValue={user?.role || ""} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" /></div>
                        <div className="pt-4">
                          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                            <Save className="h-4 w-4" />Enregistrer les modifications
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "company" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations de l&apos;entreprise</h2>
                      <div className="space-y-4 max-w-md">
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom de l&apos;entreprise</label>
                          <input type="text" placeholder="SEKA Enterprise" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">IFU / SIRET</label>
                          <input type="text" placeholder="123456789" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                          <input type="text" placeholder="Cotonou, Bénin" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                            <option>Bénin</option><option>Togo</option><option>Côte d&apos;Ivoire</option><option>Sénégal</option>
                          </select></div>
                        <div className="pt-4">
                          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                            <Save className="h-4 w-4" />Enregistrer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "notifications" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Préférences de notification</h2>
                      <div className="space-y-4">
                        {[
                          { label: "Notifications par email", desc: "Recevoir des emails pour les événements importants" },
                          { label: "Factures en retard", desc: "Alertes pour les factures impayées" },
                          { label: "Nouveaux clients", desc: "Notification lors de l&apos;ajout d&apos;un nouveau client" },
                          { label: "Rapports hebdomadaires", desc: "Recevoir un résumé chaque semaine" },
                          { label: "Alertes de stock", desc: "Alertes quand le stock est bas" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div><p className="text-sm font-medium text-gray-900">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1e3a5f] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a5f]"></div>
                            </label>
                          </div>
                        ))}
                        <div className="pt-4">
                          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                            <Save className="h-4 w-4" />Enregistrer les préférences
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "security" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Sécurité et authentification</h2>
                      <div className="space-y-6 max-w-md">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Changer le mot de passe</h3>
                          <div className="space-y-3">
                            <input type="password" placeholder="Mot de passe actuel" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                            <input type="password" placeholder="Nouveau mot de passe" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                            <input type="password" placeholder="Confirmer le nouveau mot de passe" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Authentification à deux facteurs</h3>
                          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-gray-500" />
                              <div><p className="text-sm font-medium text-gray-900">2FA désactivée</p><p className="text-xs text-gray-500">Ajoutez une couche de sécurité</p></div>
                            </div>
                            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100">Activer</button>
                          </div>
                        </div>
                        <div className="pt-4">
                          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                            <Save className="h-4 w-4" />Mettre à jour le mot de passe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "billing" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Facturation et abonnement</h2>
                      <div className="space-y-6">
                        <div className="bg-[#1e3a5f] rounded-lg p-6 text-white">
                          <p className="text-sm opacity-90 mb-2">Plan actuel</p>
                          <h3 className="text-2xl font-bold mb-4">Business</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">65,000</span><span className="text-lg opacity-90">FCFA/mois</span>
                          </div>
                          <button onClick={() => router.push("/pricing")} className="mt-4 px-4 py-2 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30">Changer de plan</button>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
                          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-gray-500" />
                              <div><p className="text-sm font-medium text-gray-900">Mobile Money</p><p className="text-xs text-gray-500">Orange Money •••• 1234</p></div>
                            </div>
                            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Modifier</button>
                          </div>
                        </div>
                        <button onClick={() => router.push("/billing")} className="w-full py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Voir l&apos;historique de facturation</button>
                      </div>
                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-6">Préférences d&apos;affichage</h2>
                      <div className="space-y-4 max-w-md">
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                            <option>Français</option><option>English</option><option>Português</option>
                          </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                            <option>WAT (UTC+1) - Bénin</option><option>GMT (UTC+0) - Togo</option>
                          </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Format de date</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                            <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                          </select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                            <option>FCFA (XOF)</option><option>EUR (€)</option><option>USD ($)</option>
                          </select></div>
                        <div className="pt-4">
                          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#172e4d]">
                            <Save className="h-4 w-4" />Enregistrer les préférences
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
