/**
 * Multi-devises - SEKA
 * Gestion des opérations en devises étrangères
 */
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Globe,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
} from "lucide-react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  last_updated: string;
  is_base: boolean;
}

interface CurrencyBalance {
  currency_code: string;
  currency_name: string;
  balance: number;
  balance_in_base: number;
  unrealized_gain_loss: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MultiCurrencyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    try {
      const [currRes, balRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/accounting/currencies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/v1/accounting/currency-balances`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (currRes.ok) {
        const data = await currRes.json();
        setCurrencies(data.currencies || []);
      }
      if (balRes.ok) {
        const data = await balRes.json();
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRates = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;

    setUpdating(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/accounting/currencies/update-rates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  const formatCurrency = (amount: number, code: string = "XOF") => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code, minimumFractionDigits: 0 }).format(amount);
  };

  const totalUnrealizedGainLoss = balances.reduce((sum, b) => sum + b.unrealized_gain_loss, 0);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <>
      <Head><title>Multi-devises - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestion multi-devises</h1>
                <p className="text-sm text-gray-500 mt-1">Gérez vos opérations en devises étrangères</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={updateRates} disabled={updating} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
                  Actualiser taux
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                  <Plus className="h-4 w-4" /> Ajouter devise
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Résumé gains/pertes de change */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Écarts de conversion (gains/pertes latents)</p>
                <p className={`text-2xl font-semibold ${totalUnrealizedGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalUnrealizedGainLoss >= 0 ? "+" : ""}{formatCurrency(totalUnrealizedGainLoss)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalUnrealizedGainLoss >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                {totalUnrealizedGainLoss >= 0 ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Taux de change */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Taux de change</h2>
                <button onClick={() => router.push("/settings/currencies")} className="p-1 text-gray-400 hover:text-gray-600">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {currencies.map((curr) => (
                  <div key={curr.code} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{curr.code}</p>
                        <p className="text-xs text-gray-500">{curr.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {curr.is_base ? (
                        <span className="text-xs text-primary-600 font-medium">Devise de base</span>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900">1 {curr.code} = {curr.rate.toFixed(4)} XOF</p>
                          <p className="text-xs text-gray-500">Màj: {new Date(curr.last_updated).toLocaleDateString("fr-FR")}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Soldes par devise */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">Soldes par devise</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {balances.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">Aucun solde en devise</div>
                ) : balances.map((bal) => (
                  <div key={bal.currency_code} className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bal.currency_code}</p>
                        <p className="text-xs text-gray-500">{bal.currency_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(bal.balance, bal.currency_code)}</p>
                        <p className="text-xs text-gray-500">≈ {formatCurrency(bal.balance_in_base)}</p>
                      </div>
                    </div>
                    {bal.unrealized_gain_loss !== 0 && (
                      <div className="mt-2 flex items-center justify-end">
                        <span className={`inline-flex items-center gap-1 text-xs ${bal.unrealized_gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {bal.unrealized_gain_loss >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          Écart: {bal.unrealized_gain_loss >= 0 ? "+" : ""}{formatCurrency(bal.unrealized_gain_loss)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddCurrencyModal onClose={() => setShowAddModal(false)} onAdded={fetchData} />}
    </>
  );
}

function AddCurrencyModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ code: "", name: "", rate: 1 });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/accounting/currencies`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { onClose(); onAdded(); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une devise</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code (ISO 4217)</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EUR, USD, GBP..." maxLength={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Euro, Dollar américain..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taux (1 devise = X XOF)</label>
            <input type="number" step="0.0001" value={form.rate} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={handleAdd} disabled={loading || !form.code || !form.name} className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
