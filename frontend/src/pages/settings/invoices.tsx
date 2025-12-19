/**
 * Facturation client - Style Pennylane
 * Configuration complète de la facturation avec onglets
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown, Save, ExternalLink } from "lucide-react";
import Link from "next/link";

type TabType = "configuration" | "personnalisation" | "paiements" | "emails" | "relances";

interface InvoiceSettings {
  // Numérotation
  prefix: string;
  nextNumber: number;
  format: string;
  // Infos entreprise
  companyName: string;
  address: string;
  siret: string;
  vatNumber: string;
  // Design
  logoUrl: string;
  primaryColor: string;
  showLogo: boolean;
  // Paiements
  defaultPaymentTerms: number;
  bankName: string;
  iban: string;
  bic: string;
  // Emails
  emailSubject: string;
  emailBody: string;
  sendCopy: boolean;
  // Relances
  enableReminders: boolean;
  firstReminderDays: number;
  secondReminderDays: number;
  reminderEmailSubject: string;
}

const defaultSettings: InvoiceSettings = {
  prefix: "FAC-",
  nextNumber: 1,
  format: "{PREFIX}{YEAR}-{NUMBER}",
  companyName: "",
  address: "",
  siret: "",
  vatNumber: "",
  logoUrl: "",
  primaryColor: "#1e3a5f",
  showLogo: true,
  defaultPaymentTerms: 30,
  bankName: "",
  iban: "",
  bic: "",
  emailSubject: "Facture {NUMBER} - {COMPANY}",
  emailBody: "Veuillez trouver ci-joint votre facture.\n\nCordialement,\n{COMPANY}",
  sendCopy: true,
  enableReminders: true,
  firstReminderDays: 7,
  secondReminderDays: 14,
  reminderEmailSubject: "Rappel: Facture {NUMBER} en attente",
};

export default function InvoiceSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("configuration");
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const savedSettings = localStorage.getItem("seka_invoice_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [router]);

  const handleSave = () => {
    localStorage.setItem("seka_invoice_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "configuration", label: "Configuration" },
    { id: "personnalisation", label: "Personnalisation" },
    { id: "paiements", label: "Paiements" },
    { id: "emails", label: "Emails et Annexes" },
    { id: "relances", label: "Relances automatiques" },
  ];

  return (
    <>
      <Head>
        <title>Facturation client - SEKA</title>
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
                <h1 className="text-xl font-semibold text-gray-900">Facturation client</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Paramétrez toute votre facturation client, des modèles de factures aux méthodes de paiement.
                  <a href="#" className="text-primary-600 hover:underline ml-1">En savoir plus <ExternalLink className="inline h-3 w-3" /></a>
                </p>
              </div>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saved 
                    ? "bg-green-600 text-white" 
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                <Save className="h-4 w-4" />
                {saved ? "Enregistré !" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
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
          {/* Tab: Configuration */}
          {activeTab === "configuration" && (
            <div className="space-y-6">
              {/* Numérotation */}
              <Section title="Numérotation" description="Vous devez définir une structure de numérotation unique, par type de document, avant de pouvoir les éditer.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Préfixe</label>
                    <input
                      type="text"
                      value={settings.prefix}
                      onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prochain numéro</label>
                    <input
                      type="number"
                      value={settings.nextNumber}
                      onChange={(e) => setSettings({ ...settings, nextNumber: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <input
                      type="text"
                      value={settings.format}
                      onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Exemple : {settings.prefix}2024-{String(settings.nextNumber).padStart(4, "0")}
                </p>
              </Section>

              {/* Informations entreprise */}
              <Section title="Informations d'entreprise" description="Par défaut, vos documents utilisent les informations de votre entreprise.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                    <input
                      type="text"
                      value={settings.siret}
                      onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA intracommunautaire</label>
                    <input
                      type="text"
                      value={settings.vatNumber}
                      onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Tab: Personnalisation */}
          {activeTab === "personnalisation" && (
            <div className="space-y-6">
              <Section title="Design des documents" description="Personnalisez l'apparence de vos factures et devis.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL du logo</label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showLogo}
                        onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Afficher le logo sur les documents</span>
                    </label>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Tab: Paiements */}
          {activeTab === "paiements" && (
            <div className="space-y-6">
              <Section title="Conditions de paiement" description="Définissez les conditions par défaut pour vos factures.">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Délai de paiement (jours)</label>
                  <select
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: parseInt(e.target.value) })}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={0}>Paiement immédiat</option>
                    <option value={15}>15 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={45}>45 jours</option>
                    <option value={60}>60 jours</option>
                    <option value={90}>90 jours</option>
                  </select>
                </div>
              </Section>

              <Section title="Coordonnées bancaires" description="Ces informations apparaîtront sur vos factures.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la banque</label>
                    <input
                      type="text"
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BIC</label>
                    <input
                      type="text"
                      value={settings.bic}
                      onChange={(e) => setSettings({ ...settings, bic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      value={settings.iban}
                      onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Tab: Emails */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              <Section title="Email de facturation" description="Personnalisez le contenu des emails envoyés avec vos factures.">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                    <input
                      type="text"
                      value={settings.emailSubject}
                      onChange={(e) => setSettings({ ...settings, emailSubject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corps du message</label>
                    <textarea
                      value={settings.emailBody}
                      onChange={(e) => setSettings({ ...settings, emailBody: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sendCopy}
                        onChange={(e) => setSettings({ ...settings, sendCopy: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">M&apos;envoyer une copie des emails</span>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Variables disponibles : {"{NUMBER}"}, {"{COMPANY}"}, {"{CLIENT}"}, {"{AMOUNT}"}, {"{DATE}"}
                </p>
              </Section>
            </div>
          )}

          {/* Tab: Relances */}
          {activeTab === "relances" && (
            <div className="space-y-6">
              <Section title="Relances automatiques" description="Configurez l'envoi automatique de rappels pour les factures impayées.">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableReminders}
                        onChange={(e) => setSettings({ ...settings, enableReminders: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Activer les relances automatiques</span>
                    </label>
                  </div>
                  
                  {settings.enableReminders && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Première relance après (jours)</label>
                          <input
                            type="number"
                            value={settings.firstReminderDays}
                            onChange={(e) => setSettings({ ...settings, firstReminderDays: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Deuxième relance après (jours)</label>
                          <input
                            type="number"
                            value={settings.secondReminderDays}
                            onChange={(e) => setSettings({ ...settings, secondReminderDays: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objet du rappel</label>
                        <input
                          type="text"
                          value={settings.reminderEmailSubject}
                          onChange={(e) => setSettings({ ...settings, reminderEmailSubject: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Composant Section
function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
