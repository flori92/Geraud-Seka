import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser, User } from "@/lib/api";
import {
  User as UserIcon,
  Building2,
  Bell,
  Lock,
  Palette,
  CreditCard,
  Shield,
  Mail,
  Globe,
  Save,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/router";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const tabFromQuery = typeof router.query.tab === "string" ? router.query.tab : null;
  const isHub = !tabFromQuery;

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (err: any) {
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
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
      title: "Paramètres",
      items: [
        { label: "Connexions bancaires", href: "/treasury/accounts" },
        { label: "Transmission de factures", href: "/accounting/import-statements" },
        { label: "Facturation client", href: "/ventes/factures-clients" },
        { label: "Familles analytiques", href: "/coming-soon?feature=Familles analytiques" },
        { label: "Centre de règles", href: "/settings/rules" },
        { label: "Connectivité", href: "/settings/integrations" },
        { label: "Fonctionnalités avancées", href: "/coming-soon?feature=Fonctionnalités avancées" },
        { label: "Plan comptable", href: "/accounting/chart-of-accounts" },
      ]
    },
    {
      title: "",
      items: [
        { label: "Informations entreprise", href: "/settings?tab=company" },
        { label: "Gestion de l’équipe", href: "/settings/team" },
        { label: "Gestion d’abonnement", href: "/billing" },
      ]
    },
    {
      title: "Historique",
      items: [
        { label: "Imports", href: "/settings/import" },
        { label: "Exports", href: "/exports" },
      ]
    }
  ];

  const handleSave = () => {
    setSuccess("Paramètres sauvegardés avec succès");
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <DashboardLayout title="Paramètres">
      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      {isHub ? (
        <div className="max-w-3xl">
          <Card className="overflow-hidden">
            <div className="divide-y divide-accents-2">
              {hubSections.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  {section.title ? (
                    <div className="px-6 py-4 text-xs font-semibold text-accents-5 uppercase tracking-wider bg-accents-1">
                      {section.title}
                    </div>
                  ) : null}
                  <div className="divide-y divide-accents-2">
                    {section.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => router.push(item.href)}
                        className="w-full flex items-center justify-between px-6 py-4 text-sm text-foreground hover:bg-accents-1 transition-colors"
                      >
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-accents-5" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <Card className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(`/settings?tab=${tab.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "text-accents-6 hover:bg-accents-1 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Informations personnelles</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom complet
                    </label>
                    <Input
                      defaultValue={user?.full_name || ""}
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      defaultValue={user?.email || ""}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      placeholder="+229 XX XX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rôle
                    </label>
                    <Input
                      defaultValue={user?.role || ""}
                      disabled
                      className="bg-accents-1"
                    />
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "company" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Informations de l'entreprise</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom de l'entreprise
                    </label>
                    <Input placeholder="SEKA Enterprise" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      IFU / SIRET
                    </label>
                    <Input placeholder="123456789" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Adresse
                    </label>
                    <Input placeholder="Cotonou, Bénin" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Pays
                    </label>
                    <select className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Bénin</option>
                      <option>Togo</option>
                      <option>Côte d'Ivoire</option>
                      <option>Sénégal</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Préférences de notification</h2>

                <div className="space-y-4">
                  {[
                    { label: "Notifications par email", description: "Recevoir des emails pour les événements importants" },
                    { label: "Factures en retard", description: "Alertes pour les factures impayées" },
                    { label: "Nouveaux clients", description: "Notification lors de l'ajout d'un nouveau client" },
                    { label: "Rapports hebdomadaires", description: "Recevoir un résumé chaque semaine" },
                    { label: "Alertes de stock", description: "Alertes quand le stock est bas" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-accents-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-accents-6">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-accents-3 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les préférences
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Sécurité et authentification</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4">Changer le mot de passe</h3>
                    <div className="space-y-3">
                      <Input type="password" placeholder="Mot de passe actuel" />
                      <Input type="password" placeholder="Nouveau mot de passe" />
                      <Input type="password" placeholder="Confirmer le nouveau mot de passe" />
                    </div>
                  </div>

                  <div className="border-t border-accents-2 pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Authentification à deux facteurs</h3>
                    <div className="flex items-center justify-between bg-accents-1 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-accents-6" />
                        <div>
                          <p className="text-sm font-medium text-foreground">2FA désactivée</p>
                          <p className="text-xs text-accents-6">Ajoutez une couche de sécurité supplémentaire</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">Activer</Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Mettre à jour le mot de passe
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Facturation et abonnement</h2>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Plan actuel</p>
                    <h3 className="text-2xl font-bold mb-4">Business</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">65,000</span>
                      <span className="text-lg opacity-90">FCFA/mois</span>
                    </div>
                    <Button variant="secondary" size="sm" className="mt-4">
                      Changer de plan
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4">Méthode de paiement</h3>
                    <div className="border border-accents-3 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-accents-6" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Mobile Money</p>
                            <p className="text-xs text-accents-6">Orange Money •••• 1234</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">Modifier</Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button variant="secondary" size="md" className="w-full">
                      Voir l'historique de facturation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Préférences d'affichage</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Langue
                    </label>
                    <select className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Français</option>
                      <option>English</option>
                      <option>Português</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Fuseau horaire
                    </label>
                    <select className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>WAT (UTC+1) - Bénin</option>
                      <option>GMT (UTC+0) - Togo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Format de date
                    </label>
                    <select className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Devise
                    </label>
                    <select className="w-full px-4 py-2 border border-accents-3 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>FCFA (XOF)</option>
                      <option>EUR (€)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <Button variant="primary" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les préférences
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
