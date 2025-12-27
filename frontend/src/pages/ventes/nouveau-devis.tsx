import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Textarea } from "@/components/ui/Textarea";
import { createQuote, QuoteCreate, getClients, Client } from "@/lib/api";
import { Plus, Trash2, Save, X, FileText } from "lucide-react";

interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NouveauDevis() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("seka_access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchClients();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      expiry_date: expiryDate.toISOString().split("T")[0],
    }));
  }, [router]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) return;
      const data = await getClients(token);
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        throw new Error("Vous devez être connecté");
      }

      const data: QuoteCreate = {
        title: formData.title || "Devis",
        client_id: formData.client_id,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        items: items.filter((item) => item.description && item.quantity > 0),
      };

      if (data.items.length === 0) {
        throw new Error("Veuillez ajouter au moins un article");
      }

      await createQuote(data, token);

      setSuccess(true);
      setTimeout(() => {
        router.push("/ventes");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "description" ? value : parseFloat(value) || 0,
    };
    setItems(newItems);
  };

  const calculateSubtotal = (item: QuoteItem) => {
    return item.quantity * item.unit_price;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  return (
    <>
      <Head>
        <title>Nouveau devis - SEKA</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Nouveau devis</h1>
                <p className="text-sm text-gray-500">Créez une nouvelle proposition commerciale</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push("/ventes")}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {error && (
                  <Alert variant="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="mb-4">
                    Devis créé avec succès ! Redirection...
                  </Alert>
                )}

                {/* Title & Client */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      label="Titre du devis"
                      placeholder="Ex: Proposition pour..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Laissez vide pour utiliser &quot;Devis&quot; par défaut
                    </p>
                  </div>

                  <div>
                    <Select
                      label="Client *"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      label="Date d'émission *"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Valable jusqu'au *"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Par défaut: 30 jours après la date d&apos;émission
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">Articles du devis</label>
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                      <Plus className="mr-1 h-4 w-4" />
                      Ajouter une ligne
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-3 px-3 text-xs font-medium text-gray-500 uppercase">
                      <div className="col-span-6">Description</div>
                      <div className="col-span-2">Quantité</div>
                      <div className="col-span-2">Prix unitaire</div>
                      <div className="col-span-1 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Items */}
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-start">
                        <div className="col-span-6">
                          <Input
                            placeholder="Description de l'article ou service"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                            min="0"
                            step="100"
                            required
                          />
                        </div>
                        <div className="col-span-1 pt-2 text-sm font-medium text-gray-900 text-right">
                          {calculateSubtotal(item).toLocaleString()}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 rounded hover:bg-red-50 text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex justify-end">
                    <div className="w-72 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Sous-total HT</span>
                        <span className="font-medium text-gray-900">
                          {calculateTotal().toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">TVA (18%)</span>
                        <span className="font-medium text-gray-900">
                          {(calculateTotal() * 0.18).toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total TTC</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {(calculateTotal() * 1.18).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/ventes")}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? (
                      "Création en cours..."
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Créer le devis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
