import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { 
  ChevronLeft, ChevronRight, Save, Check, X, Edit2, 
  RefreshCw, MessageCircle, MoreVertical, Download,
  ZoomIn, AlertCircle, CheckCircle, Loader2
} from "lucide-react";
import AccountAutocomplete, { type Account } from "@/components/AccountAutocomplete";

const PdfViewer = dynamic(() => import('@/components/DocumentPdfViewer'), { ssr: false });

interface InvoiceData {
  id: string;
  document_id?: string;
  document_url?: string;
  supplier_name: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  amount_ht: number;
  amount_vat: number;
  amount_ttc: number;
  vat_rate: number;
  status: "pending" | "pre_processed" | "validated" | "rejected";
  suggested_account?: string;
  suggested_label?: string;
}

interface EntryLine {
  journal: string;
  date: string;
  account_code: string;
  account_label: string;
  label: string;
  debit: number;
  credit: number;
  is_auxiliary?: boolean;
}

interface SupplierRule {
  supplier_name: string;
  charge_account: string;
  vat_account: string;
  supplier_account: string;
  vat_rate: number;
}

export default function ValidateInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [entryLines, setEntryLines] = useState<EntryLine[]>([]);
  const [supplierRule, setSupplierRule] = useState<SupplierRule | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(1);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";

  const fetchSupplierRule = useCallback(async (supplierName: string) => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${apiPrefix}/accounting-rules/supplier-rules?supplier_name=${encodeURIComponent(supplierName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSupplierRule(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching supplier rule:", error);
    }
  }, [apiPrefix]);

  const fetchInvoice = useCallback(async (invoiceId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiPrefix}/supplier-invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        generateEntryLines(data);
        fetchSupplierRule(data.supplier_name);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, router, fetchSupplierRule]);

  const fetchPendingInvoices = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(`${apiPrefix}/supplier-invoices?status=pending,pre_processed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const ids = data.map((inv: InvoiceData) => inv.id);
        setPendingIds(ids);
        setTotalInvoices(ids.length);
        if (id) {
          const idx = ids.indexOf(id as string);
          if (idx >= 0) setCurrentIndex(idx);
        }
      }
    } catch (error) {
      console.error("Error fetching pending invoices:", error);
    }
  }, [apiPrefix, id]);


  const fetchAccounts = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(`${apiPrefix}/accounting/chart-of-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.map((acc: Record<string, string>) => ({
          code: acc.account_number || acc.code,
          name: acc.name || acc.label
        })));
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }, [apiPrefix]);

  useEffect(() => {
    if (id) {
      fetchInvoice(id as string);
      fetchPendingInvoices();
      fetchAccounts();
    }
  }, [id, fetchInvoice, fetchPendingInvoices, fetchAccounts]);

  const generateEntryLines = (inv: InvoiceData) => {
    const date = inv.issue_date || new Date().toISOString().slice(0, 10);
    const chargeAccount = inv.suggested_account || "6061";
    const vatAccount = "4454";
    const supplierAccount = `401${inv.supplier_name.substring(0, 6).toUpperCase().replace(/\s/g, '')}`;

    const lines: EntryLine[] = [
      {
        journal: "ACH",
        date,
        account_code: chargeAccount,
        account_label: "Charges",
        label: `Facture ${inv.invoice_number}`,
        debit: inv.amount_ht,
        credit: 0
      },
      {
        journal: "ACH",
        date,
        account_code: vatAccount,
        account_label: "TVA déductible 18%",
        label: `TVA ${inv.invoice_number}`,
        debit: inv.amount_vat,
        credit: 0
      },
      {
        journal: "ACH",
        date,
        account_code: supplierAccount,
        account_label: `Fournisseur ${inv.supplier_name}`,
        label: `Facture ${inv.invoice_number}`,
        debit: 0,
        credit: inv.amount_ttc,
        is_auxiliary: true
      }
    ];

    setEntryLines(lines);
  };

  const updateLine = (index: number, field: keyof EntryLine, value: string | number) => {
    const newLines = [...entryLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEntryLines(newLines);
  };

  const getTotalDebit = () => entryLines.reduce((sum, line) => sum + line.debit, 0);
  const getTotalCredit = () => entryLines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;
  const htPlusVatEqualsTtc = invoice ? 
    Math.abs((invoice.amount_ht + invoice.amount_vat) - invoice.amount_ttc) < 0.01 : false;

  const handleSave = async () => {
    if (!invoice || !isBalanced) return;
    setSaving(true);
    
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(`${apiPrefix}/accounting-entries/entries/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          journal_type: 'ACH',
          date: invoice.issue_date,
          reference: invoice.invoice_number,
          description: `Facture ${invoice.supplier_name} - ${invoice.invoice_number}`,
          document_id: invoice.document_id,
          lines: entryLines.map(line => ({
            account_code: line.account_code,
            label: line.label,
            debit: line.debit,
            credit: line.credit
          }))
        })
      });

      if (response.ok) {
        await fetch(`${apiPrefix}/supplier-invoices/${invoice.id}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'validated' })
        });
      }
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    await handleSave();
    if (currentIndex < totalInvoices - 1) {
      navigateToInvoice(currentIndex + 1);
    } else {
      router.push("/accounting/entries?status=validated");
    }
  };

  const navigateToInvoice = (index: number) => {
    if (index >= 0 && index < pendingIds.length) {
      router.push(`/accounting/entries/validate/${pendingIds[index]}`);
    }
  };

  const regenerateEntries = () => {
    if (invoice) {
      generateEntryLines(invoice);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Facture non trouvée</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Validation Facture - SEKA</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Facture {currentIndex + 1} / {totalInvoices}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateToInvoice(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigateToInvoice(currentIndex + 1)}
                  disabled={currentIndex >= totalInvoices - 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>0</span>
              </div>
              <button className="p-1.5 rounded hover:bg-gray-100">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !isBalanced}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
              <button
                onClick={handleValidate}
                disabled={saving || !isBalanced}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Valider
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Split View */}
        <div className="flex h-[calc(100vh-130px)]">
          {/* Left Panel - PDF Viewer */}
          <div className="w-1/2 bg-gray-800 flex flex-col">
            <div className="flex-1 overflow-hidden">
              {invoice.document_url ? (
                <PdfViewer url={invoice.document_url} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Aperçu non disponible</p>
                </div>
              )}
            </div>
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded hover:bg-gray-700 text-gray-400">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-gray-700 text-gray-400">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Invoice Data & Entries */}
          <div className="w-1/2 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Extracted Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Informations Extraites
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type de tiers</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option>Fournisseur</option>
                        <option>Client</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tiers</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={invoice.supplier_name}
                          readOnly={!isEditing}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                        />
                        <button className="px-2 text-gray-400 hover:text-gray-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Numéro de facture</label>
                      <input
                        type="text"
                        value={invoice.invoice_number}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Émission</label>
                      <input
                        type="date"
                        value={invoice.issue_date}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Échéance</label>
                      <input
                        type="date"
                        value={invoice.due_date || ''}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Compte d&apos;imputation</label>
                      <AccountAutocomplete
                        value={invoice.suggested_account || "6061"}
                        onChange={() => {}}
                        accounts={accounts}
                        placeholder="Sélectionner..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Libellé de l&apos;écriture</label>
                      <input
                        type="text"
                        value={invoice.suggested_label || `Facture ${invoice.invoice_number}`}
                        readOnly={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Total TTC</label>
                      <input
                        type="text"
                        value={`${invoice.amount_ttc.toLocaleString()} FCFA`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Montant HT</label>
                      <input
                        type="text"
                        value={`${invoice.amount_ht.toLocaleString()} FCFA`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Montant TVA</label>
                      <input
                        type="text"
                        value={`${invoice.amount_vat.toLocaleString()} FCFA`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Taux TVA</label>
                      <input
                        type="text"
                        value={`${invoice.vat_rate}%`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {htPlusVatEqualsTtc ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">HT + TVA = TTC ✓</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-500">Vérifier les montants</span>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Supplier Rule */}
              {supplierRule && (
                <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-800">
                      Règle Fournisseur Appliquée
                    </h4>
                    <button className="text-xs text-blue-600 hover:underline">
                      Modifier la règle
                    </button>
                  </div>
                  <p className="text-sm text-blue-700">
                    {supplierRule.supplier_name} → {supplierRule.charge_account} + {supplierRule.vat_account} + {supplierRule.supplier_account}
                  </p>
                </section>
              )}

              {/* Generated Entries */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Écritures Générées
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={regenerateEntries}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-générer
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {isEditing ? "Verrouiller" : "Modifier"}
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Jrnl</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Compte</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Débit</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-xs">{line.journal}</td>
                          <td className="px-3 py-2 text-xs">{line.date}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <AccountAutocomplete
                                  value={line.account_code}
                                  onChange={(code) => updateLine(idx, 'account_code', code)}
                                  accounts={accounts}
                                  placeholder="Compte..."
                                />
                              ) : (
                                <>
                                  <span className="font-mono text-xs">{line.account_code}</span>
                                  <span className="text-gray-500">- {line.account_label}</span>
                                  {line.is_auxiliary && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">A</span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.debit}
                                onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border rounded text-right text-sm"
                              />
                            ) : (
                              line.debit > 0 ? line.debit.toLocaleString() : '-'
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.credit}
                                onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border rounded text-right text-sm"
                              />
                            ) : (
                              line.credit > 0 ? line.credit.toLocaleString() : '-'
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                        <td colSpan={3} className="px-3 py-2 text-right">TOTAL</td>
                        <td className="px-3 py-2 text-right font-mono">{getTotalDebit().toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono">{getTotalCredit().toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  {isBalanced ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Écritures équilibrées</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Déséquilibre: {Math.abs(getTotalDebit() - getTotalCredit()).toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
