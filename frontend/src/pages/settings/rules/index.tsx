import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PennylaneSidebar } from "@/components/layout/PennylaneSidebar";
import { 
  getSuppliers, getClients, getProducts,
  type Supplier, type Client, type Product
} from "@/lib/api";
import { 
  Search, Plus, Download, Upload, Settings2, 
  MoreHorizontal, Loader2
} from "lucide-react";

type TabType = "transactions" | "fournisseurs" | "clients" | "produits";

export default function RulesCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("fournisseurs");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("seka_access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const [suppliersData, clientsData, productsData] = await Promise.all([
          getSuppliers(token),
          getClients(token),
          getProducts(token)
        ]);
        
        setSuppliers(suppliersData);
        setClients(clientsData);
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount < 0 ? <span className="text-red-600">-{formatted} €</span> : <span>{formatted} €</span>;
  };

  const tabs = [
    { id: "fournisseurs" as TabType, label: "Fournisseurs", count: suppliers.length },
    { id: "clients" as TabType, label: "Clients", count: clients.length },
    { id: "produits" as TabType, label: "Produits", count: products.length },
  ];

  // Filter data based on search
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Centre de règles - SEKA</title></Head>
      <div className="min-h-screen bg-gray-50">
        <PennylaneSidebar />
        <main className="ml-[220px] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Centre de règles</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                Importer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                Nouveau
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          {/* Tabs & Content */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center border-b border-gray-200 px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label} <span className="text-gray-400 ml-1">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button className="ml-auto flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <Settings2 className="w-4 h-4" />
                  Personnaliser
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {activeTab === "fournisseurs" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte par défaut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux TVA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total dépensé</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                          Aucun fournisseur trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{supplier.nif || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{supplier.default_account || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {supplier.default_tax_rate ? `${supplier.default_tax_rate}%` : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{supplier.email || "-"}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {supplier.total_spent ? formatCurrency(-supplier.total_spent) : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "clients" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          Aucun client trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{client.slug}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{client.sector || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "produits" && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          Aucun produit trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{product.sku || "-"}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{product.stock_quantity}</td>
                          <td className="px-4 py-3 text-center">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {activeTab === "fournisseurs" && `${filteredSuppliers.length} fournisseurs`}
                {activeTab === "clients" && `${filteredClients.length} clients`}
                {activeTab === "produits" && `${filteredProducts.length} produits`}
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
