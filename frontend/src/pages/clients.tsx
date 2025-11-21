import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getClients, createClient, type Client } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [sector, setSector] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchClients = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (token) {
            try {
                const data = await getClients(token);
                setClients(data);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            await createClient({ name, slug, sector }, token);
            alert("Client créé avec succès !");
            setShowCreate(false);
            setName("");
            setSlug("");
            setSector("");
            fetchClients();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du client");
        } finally {
            setCreating(false);
        }
    };

    return (
        <DashboardLayout title="Clients">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
                        <p className="text-sm text-accents-5">Gérez vos dossiers clients.</p>
                    </div>
                    <Button onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? "Fermer" : "Nouveau Client"}
                    </Button>
                </div>

                {showCreate && (
                    <Card className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-lg">
                        <h2 className="mb-4 text-lg font-medium text-foreground">Nouveau Client</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                label="Nom de l'entreprise"
                                placeholder="Ex: Acme Corp"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input
                                label="Identifiant (Slug)"
                                placeholder="Ex: acme-corp"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required
                            />
                            <Input
                                label="Secteur d'activité"
                                placeholder="Ex: Commerce"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
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
                                <TableHeader>Nom</TableHeader>
                                <TableHeader>Identifiant</TableHeader>
                                <TableHeader>Secteur</TableHeader>
                                <TableHeader>Statut</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={5}>Chargement...</TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={5}>Aucun client trouvé.</TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{client.name}</div>
                                        </TableCell>
                                        <TableCell>{client.slug}</TableCell>
                                        <TableCell>{client.sector || "-"}</TableCell>
                                        <TableCell><Badge variant="success">Actif</Badge></TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">Gérer</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
}
