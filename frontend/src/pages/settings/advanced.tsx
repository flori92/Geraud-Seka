/**
 * Fonctionnalités avancées - Style Pennylane
 * Activation/désactivation des fonctionnalités du plan
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown, ChevronUp, Zap } from "lucide-react";
import Link from "next/link";

interface Feature {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  expandable?: boolean;
  expanded?: boolean;
  subFeatures?: { id: string; title: string; enabled: boolean }[];
}

const defaultFeatures: Feature[] = [
  {
    id: "supplier-invoice-control",
    title: "Contrôle des factures fournisseurs",
    description: "Déléguez la validation des factures à vos équipes métiers pour ne payer que les dépenses autorisées.",
    enabled: true,
  },
  {
    id: "purchase-requests",
    title: "Gestion des demandes d'achats",
    description: "Centralisez vos demandes d'achat pour mieux maîtriser vos engagements financiers.",
    enabled: true,
    expandable: true,
  },
  {
    id: "accounting-payments",
    title: "Gestion des paiements comptables",
    description: "Permettez le paiement des factures importées sous forme d'écritures comptables, même en l'absence de documents associés.",
    enabled: false,
  },
  {
    id: "advanced-analytics",
    title: "Analytique avancée",
    description: "Optimisez la gestion de vos données financières grâce à l'analytique avancée, en associant facilement des codes à vos catégories pour une analyse précise.",
    enabled: true,
    expandable: true,
  },
  {
    id: "ai-categories",
    title: "Suggestion de catégories par IA",
    description: "Profitez de la puissance de l'IA pour obtenir des suggestions de catégories basées sur vos données historiques, simplifiant ainsi votre gestion comptable.",
    enabled: true,
    expandable: true,
  },
  {
    id: "auto-reconciliation",
    title: "Rapprochement bancaire automatique",
    description: "Laissez l'IA rapprocher automatiquement vos transactions bancaires avec vos factures et écritures comptables.",
    enabled: true,
  },
  {
    id: "multi-currency",
    title: "Gestion multi-devises",
    description: "Gérez vos transactions en plusieurs devises avec conversion automatique selon les taux de change.",
    enabled: false,
  },
  {
    id: "budget-alerts",
    title: "Alertes budgétaires",
    description: "Recevez des notifications lorsque vos dépenses approchent ou dépassent les seuils définis.",
    enabled: true,
  },
];

export default function AdvancedFeaturesPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Charger les préférences sauvegardées
    const savedFeatures = localStorage.getItem("seka_advanced_features");
    if (savedFeatures) {
      setFeatures(JSON.parse(savedFeatures));
    }
  }, [router]);

  const toggleFeature = (featureId: string) => {
    const updated = features.map(f => 
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    );
    setFeatures(updated);
    localStorage.setItem("seka_advanced_features", JSON.stringify(updated));
  };

  const toggleExpand = (featureId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(featureId)) {
      newExpanded.delete(featureId);
    } else {
      newExpanded.add(featureId);
    }
    setExpandedFeatures(newExpanded);
  };

  return (
    <>
      <Head>
        <title>Fonctionnalités avancées - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Retour aux paramètres
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Fonctionnalités avancées</h1>
            <p className="text-sm text-gray-500 mt-1">
              Découvrez et utilisez toutes les fonctionnalités incluses dans votre plan.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={`relative mt-1 w-11 h-6 rounded-full transition-colors ${
                        feature.enabled ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          feature.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">{feature.title}</h3>
                        {feature.id.includes("ai") && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">
                            <Zap className="w-3 h-3" /> IA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                    </div>

                    {/* Expand button */}
                    {feature.expandable && (
                      <button
                        onClick={() => toggleExpand(feature.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        {expandedFeatures.has(feature.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {feature.expandable && expandedFeatures.has(feature.id) && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="pl-15 border-t border-gray-100 pt-4 ml-15">
                      <p className="text-xs text-gray-500">
                        Configuration détaillée disponible dans les paramètres spécifiques de cette fonctionnalité.
                      </p>
                      <Link
                        href={`/settings/${feature.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Configurer →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> Certaines fonctionnalités peuvent nécessiter une configuration supplémentaire 
              après activation. Les modifications sont sauvegardées automatiquement.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
