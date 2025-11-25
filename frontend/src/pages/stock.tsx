import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getProducts, createProduct, updateProduct, type Product } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function StockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [price, setPrice] = useState("");
    const [stockQuantity, setStockQuantity] = useState("");
    const [minStockAlert, setMinStockAlert] = useState("5");
    const [creating, setCreating] = useState(false);

    const fetchProducts = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (token) {
            try {
                const data = await getProducts(token);
                setProducts(data);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            await createProduct({
                name,
                sku,
                price: Number(price),
                stock_quantity: Number(stockQuantity),
                min_stock_alert: Number(minStockAlert),
                // client_id is optional - backend will use tenant from JWT
            }, token);
            alert("Produit créé avec succès !");
            setShowCreate(false);
            setName("");
            setSku("");
            setPrice("");
            setStockQuantity("");
            setMinStockAlert("5");
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du produit");
        } finally {
            setCreating(false);
        }
    };

    const handleStockUpdate = async (productId: string, newQuantity: number) => {
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            await updateProduct(productId, { stock_quantity: newQuantity }, token);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour du stock");
        }
    };

    return (
        <DashboardLayout title="Stock">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
                        <p className="text-sm text-accents-5">Gestion des produits et inventaire.</p>
                    </div>
                    <Button onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? "Fermer" : "Nouveau Produit"}
                    </Button>
                </div>

                {showCreate && (
                    <Card className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-lg">
                        <h2 className="mb-4 text-lg font-medium text-foreground">Nouveau Produit</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                label="Nom du produit"
                                placeholder="Ex: Cahier 100 pages"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            <Input
                                label="Référence (SKU)"
                                placeholder="Ex: CAH-100"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Prix (FCFA)"
                                    type="number"
                                    placeholder="500"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Quantité initiale"
                                    type="number"
                                    placeholder="100"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(e.target.value)}
                                    required
                                />
                            </div>

                            <Input
                                label="Alerte stock minimum"
                                type="number"
                                placeholder="5"
                                value={minStockAlert}
                                onChange={(e) => setMinStockAlert(e.target.value)}
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
                                <Button type="submit" loading={creating}>Créer</Button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card className="overflow-hidden p-0">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Produit</TableHeader>
                                <TableHeader>Référence</TableHeader>
                                <TableHeader>Prix</TableHeader>
                                <TableHeader>Stock</TableHeader>
                                <TableHeader>Statut</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={6}>Chargement...</TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={6}>Aucun produit en stock.</TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => {
                                    const isLowStock = product.stock_quantity <= (product.min_stock_alert || 5);
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{product.name}</div>
                                            </TableCell>
                                            <TableCell>{product.sku || "-"}</TableCell>
                                            <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                                            <TableCell className="font-medium">{product.stock_quantity}</TableCell>
                                            <TableCell>
                                                <Badge variant={isLowStock ? "error" : "success"}>
                                                    {isLowStock ? "Stock faible" : "Disponible"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStockUpdate(product.id, product.stock_quantity + 1)}
                                                    >
                                                        +
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStockUpdate(product.id, Math.max(0, product.stock_quantity - 1))}
                                                    >
                                                        -
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
}
