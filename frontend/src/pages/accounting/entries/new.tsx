import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Plus, Trash2, Save, X, Sparkles, Wand2, Search } from "lucide-react";

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface EntryLine {
  account_id: string;
  label: string;
  debit: string;
  credit: string;
}

export default function NewAccountingEntry() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalType, setJournalType] = useState("OD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiPrefix = API_BASE_URL ? `${API_BASE_URL}/api/v1` : "/api/v1";
  const [lines, setLines] = useState<EntryLine[]>([
    { account_id: "", label: "", debit: "0", credit: "0" },
    { account_id: "", label: "", debit: "0", credit: "0" }
  ]);

  const fetchAccounts = useCallback(async () => {
    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${apiPrefix}/accounting/ledger/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }, [apiPrefix]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addLine = () => {
    setLines([...lines, { account_id: "", label: "", debit: "0", credit: "0" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof EntryLine, value: string) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const getTotalDebit = () => 
    lines.reduce((sum, line) => sum + parseFloat(line.debit || "0"), 0);

  const getTotalCredit = () => 
    lines.reduce((sum, line) => sum + parseFloat(line.credit || "0"), 0);

  const isBalanced = () => 
    Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;

  const handleSubmit = async () => {
    if (!isBalanced()) {
      alert("L'écriture n'est pas équilibrée");
      return;
    }

    if (lines.some((line) => !line.account_id)) {
      alert("Veuillez sélectionner un compte pour chaque ligne");
      return;
    }

    const token = localStorage.getItem("seka_access_token");
    try {
      const response = await fetch(
        `${apiPrefix}/accounting-entries/entries/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            journal_type: journalType,
            date,
            reference,
            description,
            lines: lines.map(line => ({
              account_id: line.account_id,
              label: line.label,
              debit: parseFloat(line.debit || "0"),
              credit: parseFloat(line.credit || "0")
            }))
          })
        }
      );

      if (response.ok) {
        router.push("/accounting/entries");
      } else {
        const error = await response.json();
        alert(error.detail || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating entry:", error);
      alert("Erreur lors de la création");
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_code.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.account_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const applyTemplate = (type: "vente" | "achat") => {
    if (type === "vente") {
      setJournalType("VTE");
      setDescription("Vente standard");
      setLines([
        { account_id: "", label: "Client", debit: "100000", credit: "0" },
        { account_id: "", label: "Vente", debit: "0", credit: "83333" },
        { account_id: "", label: "TVA collectée", debit: "0", credit: "16667" },
      ]);
    } else {
      setJournalType("ACH");
      setDescription("Achat standard");
      setLines([
        { account_id: "", label: "Achat", debit: "83333", credit: "0" },
        { account_id: "", label: "TVA déductible", debit: "16667", credit: "0" },
        { account_id: "", label: "Fournisseur", debit: "0", credit: "100000" },
      ]);
    }
  };

  return (
    <>
      <Head><title>Nouvelle écriture - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Nouvelle écriture comptable</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/accounting/entries")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isBalanced()}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4d] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal
                </label>
                <select
                  value={journalType}
                  onChange={(e) => setJournalType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                >
                  <option value="ACH">Achats</option>
                  <option value="VTE">Ventes</option>
                  <option value="BQ">Banque</option>
                  <option value="CA">Caisse</option>
                  <option value="OD">Opérations diverses</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Référence (optionnel)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'écriture"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </div>

            <div className="mb-4">
              <div className="flex flex-col gap-3 mb-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-700">Lignes d&apos;écriture</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Recherche compte (code ou libellé)"
                      className="outline-none text-xs text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => applyTemplate("vente")}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100"
                  >
                    <Wand2 className="w-4 h-4" />
                    Modèle Vente
                  </button>
                  <button
                    onClick={() => applyTemplate("achat")}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100"
                  >
                    <Sparkles className="w-4 h-4" />
                    Modèle Achat
                  </button>
                  <button
                    onClick={addLine}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#1e3a5f] hover:bg-[#e6f2f1] rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une ligne
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <select
                            value={line.account_id}
                            onChange={(e) => updateLine(index, "account_id", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          >
                            <option value="">Sélectionner un compte</option>
                            {filteredAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={line.label}
                            onChange={(e) => updateLine(index, "label", e.target.value)}
                            placeholder="Libellé"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={line.debit}
                            onChange={(e) => updateLine(index, "debit", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={line.credit}
                            onChange={(e) => updateLine(index, "credit", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {lines.length > 2 && (
                            <button
                              onClick={() => removeLine(index)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                        {getTotalDebit().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                        {getTotalCredit().toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {!isBalanced() && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    L&apos;écriture n&apos;est pas équilibrée. Différence: {Math.abs(getTotalDebit() - getTotalCredit()).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FCFA
                  </p>
                </div>
              )}

              {isBalanced() && getTotalDebit() > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    L&apos;écriture est équilibrée
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
