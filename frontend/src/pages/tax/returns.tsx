import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import {
  Plus,
  Download,
  Send,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Building2,
  FileSpreadsheet,
  BookOpen,
  CheckCheck,
  Upload,
  ChevronRight
} from "lucide-react";

interface TaxReturn {
  id: string;
  fiscal_year: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  status: TaxReturnStatus;
  documents: TaxReturnDocument[];
  created_at: string;
  validated_at?: string;
  declared_at?: string;
  updated_at: string;
}

type TaxReturnStatus = 'draft' | 'in_progress' | 'validated' | 'declared';

interface TaxReturnDocument {
  type: 'bilan' | 'compte_resultat' | 'annexes' | 'tableau_flux' | 'immobilisations';
  label: string;
  status: 'pending' | 'completed' | 'validated';
  file_url?: string;
  updated_at: string;
}

interface TaxReturnStats {
  exercice_en_cours: string;
  date_limite: string;
  documents_completes: number;
  total_documents: number;
}

export default function TaxReturnsPage() {
  const router = useRouter();
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [stats, setStats] = useState<TaxReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<TaxReturn | null>(null);

  useEffect(() => {
    fetchTaxReturnsData();
  }, []);

  const fetchTaxReturnsData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const returnsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/returns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (returnsResponse.ok) {
        const data = await returnsResponse.json();
        const returns = Array.isArray(data) ? data : [];
        setTaxReturns(returns);
        if (returns.length > 0) {
          setSelectedReturn(returns[0]);
        }
      }

      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/returns/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching tax returns data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: TaxReturnStatus) => {
    const configs = {
      draft: {
        label: 'Brouillon',
        color: 'bg-gray-100 text-gray-700',
        icon: FileText,
        stepIndex: 0
      },
      in_progress: {
        label: 'En cours',
        color: 'bg-blue-100 text-blue-700',
        icon: Clock,
        stepIndex: 1
      },
      validated: {
        label: 'Validée',
        color: 'bg-purple-100 text-purple-700',
        icon: CheckCircle2,
        stepIndex: 2
      },
      declared: {
        label: 'Télédéclarée',
        color: 'bg-green-100 text-green-700',
        icon: CheckCheck,
        stepIndex: 3
      }
    };
    return configs[status] || configs.draft;
  };

  const getDocumentStatusConfig = (status: 'pending' | 'completed' | 'validated') => {
    const configs = {
      pending: {
        label: 'En attente',
        color: 'text-gray-500',
        icon: Clock
      },
      completed: {
        label: 'Complété',
        color: 'text-blue-600',
        icon: CheckCircle2
      },
      validated: {
        label: 'Validé',
        color: 'text-green-600',
        icon: CheckCheck
      }
    };
    return configs[status];
  };

  const getDocumentIcon = (type: string) => {
    const icons = {
      bilan: Building2,
      compte_resultat: FileSpreadsheet,
      annexes: BookOpen,
      tableau_flux: FileText,
      immobilisations: FileText
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const handleTeleDeclare = async (returnId: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tax/returns/${returnId}/declare`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.ok) {
        fetchTaxReturnsData();
        alert('Liasse fiscale télédéclarée avec succès');
      }
    } catch (error) {
      console.error("Error declaring tax return:", error);
    }
  };

  const timelineSteps = [
    { label: 'Brouillon', status: 'draft' as TaxReturnStatus },
    { label: 'En cours', status: 'in_progress' as TaxReturnStatus },
    { label: 'Validée', status: 'validated' as TaxReturnStatus },
    { label: 'Télédéclarée', status: 'declared' as TaxReturnStatus }
  ];

  const currentStepIndex = selectedReturn ? getStatusConfig(selectedReturn.status).stepIndex : 0;

  return (
    <>
      <Head>
        <title>Liasse fiscale - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px]">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Liasse fiscale</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Préparez et télédéclarez votre liasse fiscale
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedReturn && selectedReturn.status === 'validated' && (
                  <button
                    onClick={() => handleTeleDeclare(selectedReturn.id)}
                    className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] flex items-center gap-2 text-sm font-medium"
                  >
                    <Send className="h-4 w-4" />
                    Télédéclarer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          {stats && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Exercice fiscal en cours</p>
                    <p className="text-lg font-bold text-blue-900">{stats.exercice_en_cours}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Date limite de dépôt</p>
                    <p className="text-lg font-bold text-blue-900">{formatDate(stats.date_limite)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Progression</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${(stats.documents_completes / stats.total_documents) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {stats.documents_completes}/{stats.total_documents}
                      </p>
                    </div>
                  </div>
                </div>
                {stats.documents_completes < stats.total_documents && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Documents incomplets</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar - Tax Returns List */}
              <div className="col-span-3">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Exercices fiscaux</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {loading ? (
                      <div className="p-6 text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#1e3a5f] border-r-transparent"></div>
                      </div>
                    ) : taxReturns.length === 0 ? (
                      <div className="p-6 text-center">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Aucune liasse</p>
                      </div>
                    ) : (
                      taxReturns.map((taxReturn) => {
                        const statusConfig = getStatusConfig(taxReturn.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <button
                            key={taxReturn.id}
                            onClick={() => setSelectedReturn(taxReturn)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              selectedReturn?.id === taxReturn.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {taxReturn.fiscal_year}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content - Selected Tax Return Details */}
              <div className="col-span-9">
                {selectedReturn ? (
                  <div className="space-y-6">
                    {/* Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Statut de la déclaration</h3>
                      <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" style={{ width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                          <div
                            className="h-full bg-[#1e3a5f] transition-all duration-500"
                            style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
                          ></div>
                        </div>

                        {/* Timeline Steps */}
                        <div className="relative flex justify-between">
                          {timelineSteps.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const config = getStatusConfig(step.status);
                            const StepIcon = config.icon;

                            return (
                              <div key={step.status} className="flex flex-col items-center" style={{ width: '25%' }}>
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    isCompleted
                                      ? 'bg-[#1e3a5f] text-white'
                                      : 'bg-gray-200 text-gray-400'
                                  } ${isCurrent ? 'ring-4 ring-[#1e3a5f] ring-opacity-20' : ''}`}
                                >
                                  <StepIcon className="h-5 w-5" />
                                </div>
                                <span
                                  className={`mt-2 text-xs font-medium text-center ${
                                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                {isCurrent && (
                                  <span className="mt-1 text-xs text-blue-600 font-semibold">En cours</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Documents de la liasse</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {selectedReturn.documents && selectedReturn.documents.length > 0 ? (
                          selectedReturn.documents.map((document) => {
                            const DocIcon = getDocumentIcon(document.type);
                            const statusConfig = getDocumentStatusConfig(document.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                              <div key={document.type} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <DocIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{document.label}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center gap-1 text-xs ${statusConfig.color}`}>
                                          <StatusIcon className="h-3 w-3" />
                                          {statusConfig.label}
                                        </span>
                                        {document.updated_at && (
                                          <span className="text-xs text-gray-500">
                                            • Mis à jour le {formatDate(document.updated_at)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {document.file_url ? (
                                      <>
                                        <a
                                          href={document.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </a>
                                        <a
                                          href={document.file_url}
                                          download
                                          className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                      </>
                                    ) : (
                                      <button className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1">
                                        <Upload className="h-3 w-3" />
                                        Importer
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-6 py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">Aucun document disponible</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      <div className="flex items-center gap-3">
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Télécharger tout
                        </button>
                        {selectedReturn.status === 'draft' && (
                          <button className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Marquer en cours
                          </button>
                        )}
                        {selectedReturn.status === 'in_progress' && (
                          <button className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2">
                            <CheckCheck className="h-4 w-4" />
                            Valider
                          </button>
                        )}
                        {selectedReturn.status === 'validated' && (
                          <button
                            onClick={() => handleTeleDeclare(selectedReturn.id)}
                            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#172e4d] text-sm font-medium flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Télédéclarer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aucune liasse fiscale sélectionnée</p>
                    <p className="text-sm text-gray-500">Sélectionnez un exercice fiscal dans la liste</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
