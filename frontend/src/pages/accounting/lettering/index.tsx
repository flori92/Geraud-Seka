/**
 * Lettrage automatique - SEKA
 * Rapprochement des comptes clients/fournisseurs
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Link2,
  Search,
  CheckCircle,
  Loader2,
  Zap,
} from "lucide-react";

interface Account {
  id: string;
  number: string;
  name: string;
  unlettered_count: number;
  unlettered_amount: number;
}

interface Entry {
  id: string;
  date: string;
  journal: string;
  label: string;
  debit: number;
  credit: number;
  letter_code: string | null;
  document_ref: string;
}

interface LetterGroup {
  code: string;
  entries: Entry[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LetteringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [letterGroups, setLetterGroups] = useState<LetterGroup[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [filterUnlettered, setFilterUnlettered] = useState(true);
  const [autoLettering, setAutoLettering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAccounts = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/lettering/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (accountId: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/accounting/lettering/entries`);
      url.searchParams.set("account_id", accountId);
      if (filterUnlettered) url.searchParams.set("unlettered", "true");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setLetterGroups(data.letter_groups || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchEntries(selectedAccount.id);
    }
  }, [selectedAccount, filterUnlettered]);

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleLetter = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || selectedEntries.size < 2) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/lettering/letter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entry_ids: Array.from(selectedEntries),
        }),
      });

      if (res.ok) {
        setSelectedEntries(new Set());
        if (selectedAccount) fetchEntries(selectedAccount.id);
      }
    } catch (err) {
      console.error("Erreur lettrage:", err);
    }
  };

  const handleUnletter = async (letterCode: string) => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/lettering/unletter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ letter_code: letterCode }),
      });

      if (res.ok && selectedAccount) {
        fetchEntries(selectedAccount.id);
      }
    } catch (err) {
      console.error("Erreur délettrage:", err);
    }
  };

  const handleAutoLetter = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token || !selectedAccount) return;

    setAutoLettering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/lettering/auto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account_id: selectedAccount.id }),
      });

      if (res.ok) {
        fetchEntries(selectedAccount.id);
        fetchAccounts();
      }
    } catch (err) {
      console.error("Erreur auto-lettrage:", err);
    } finally {
      setAutoLettering(false);
    }
  };

  const getSelectionBalance = () => {
    const selected = entries.filter((e) => selectedEntries.has(e.id));
    const debit = selected.reduce((sum, e) => sum + e.debit, 0);
    const credit = selected.reduce((sum, e) => sum + e.credit, 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.document_ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectionBalance = getSelectionBalance();

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Lettrage - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Lettrage des comptes</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Rapprochez les écritures de vos comptes clients et fournisseurs
                </p>
              </div>
              {selectedAccount && (
                <button
                  onClick={handleAutoLetter}
                  disabled={autoLettering}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {autoLettering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Lettrage automatique
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-4 gap-6">
            {/* Liste des comptes */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-sm font-medium text-gray-900">Comptes à lettrer</h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccount(account)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedAccount?.id === account.id ? "bg-primary-50" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{account.number}</p>
                      <p className="text-xs text-gray-500 truncate">{account.name}</p>
                      {account.unlettered_count > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          {account.unlettered_count} non lettrées
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone de lettrage */}
            <div className="col-span-3">
              {!selectedAccount ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Sélectionnez un compte</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Choisissez un compte dans la liste pour commencer le lettrage
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Barre d'outils */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={filterUnlettered}
                            onChange={(e) => setFilterUnlettered(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600"
                          />
                          Non lettrées uniquement
                        </label>
                      </div>

                      {selectedEntries.size >= 2 && (
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-gray-500">Sélection :</span>{" "}
                            <span className={selectionBalance.balanced ? "text-green-600" : "text-red-600"}>
                              {selectionBalance.balanced ? "Équilibrée" : "Non équilibrée"}
                            </span>
                          </div>
                          <button
                            onClick={handleLetter}
                            disabled={!selectionBalance.balanced}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Link2 className="h-4 w-4" />
                            Lettrer ({selectedEntries.size})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table des écritures */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="w-10 px-4 py-3"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journal</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lettrage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto" />
                            </td>
                          </tr>
                        ) : filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                              Aucune écriture trouvée
                            </td>
                          </tr>
                        ) : (
                          filteredEntries.map((entry) => (
                            <tr
                              key={entry.id}
                              className={`hover:bg-gray-50 ${
                                selectedEntries.has(entry.id) ? "bg-primary-50" : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                {!entry.letter_code && (
                                  <input
                                    type="checkbox"
                                    checked={selectedEntries.has(entry.id)}
                                    onChange={() => handleSelectEntry(entry.id)}
                                    className="rounded border-gray-300 text-primary-600"
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(entry.date).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{entry.journal}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry.label}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{entry.document_ref || "-"}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {entry.letter_code ? (
                                  <button
                                    onClick={() => handleUnletter(entry.letter_code!)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100"
                                    title="Cliquez pour délettrer"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    {entry.letter_code}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Groupes lettrés */}
                  {letterGroups.length > 0 && !filterUnlettered && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Groupes lettrés</h3>
                      <div className="flex flex-wrap gap-2">
                        {letterGroups.map((group) => (
                          <div
                            key={group.code}
                            className={`px-3 py-2 rounded-lg text-sm ${
                              group.is_balanced
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            <span className="font-medium">{group.code}</span>
                            <span className="text-xs ml-2">({group.entries.length} écritures)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
