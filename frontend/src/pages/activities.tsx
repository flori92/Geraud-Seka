import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getActivities, createActivity, type Activity } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastContainer";

export default function ActivitiesPage() {
    const { success, error: showError } = useToast();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form state
    const [type, setType] = useState<"REVENUE" | "EXPENSE">("EXPENSE");
    const [date, setDate] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchActivities = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (token) {
            try {
                const data = await getActivities(token);
                setActivities(data);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const token = localStorage.getItem("seka_access_token");
        if (!token) return;

        try {
            // Mock client_id for now
            await createActivity({
                type,
                date,
                amount: Number(amount),
                description,
                client_id: "00000000-0000-0000-0000-000000000000" // TODO: Get from context
            }, token);
            success("Activité créée avec succès !");
            setShowCreate(false);
            setDate("");
            setAmount("");
            setDescription("");
            fetchActivities();
        } catch (error: any) {
            console.error(error);
            showError(error.response?.data?.detail || "Erreur lors de la création de l'activité");
        } finally {
            setCreating(false);
        }
    };

    return (
        <DashboardLayout title="Activités">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Activités</h1>
                        <p className="text-sm text-accents-5">Suivi simplifié des ventes et dépenses.</p>
                    </div>
                    <Button onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? "Fermer" : "Nouvelle Activité"}
                    </Button>
                </div>

                {showCreate && (
                    <Card className="animate-in fade-in slide-in-from-top-4 duration-300 max-w-lg">
                        <h2 className="mb-4 text-lg font-medium text-foreground">Nouvelle Activité</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Type</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={type === "EXPENSE" ? "primary" : "ghost"}
                                        onClick={() => setType("EXPENSE")}
                                    >
                                        Dépense
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={type === "REVENUE" ? "primary" : "ghost"}
                                        onClick={() => setType("REVENUE")}
                                    >
                                        Recette
                                    </Button>
                                </div>
                            </div>

                            <Input
                                label="Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />

                            <Input
                                label="Montant (FCFA)"
                                type="number"
                                placeholder="Ex: 50000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />

                            <Input
                                label="Description"
                                placeholder="Ex: Vente marchandises"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
                                <Button type="submit" loading={creating}>Enregistrer</Button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card className="overflow-hidden p-0">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Date</TableHeader>
                                <TableHeader>Type</TableHeader>
                                <TableHeader>Description</TableHeader>
                                <TableHeader>Montant</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={4}>Chargement...</TableCell>
                                </TableRow>
                            ) : activities.length === 0 ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={4}>Aucune activité enregistrée.</TableCell>
                                </TableRow>
                            ) : (
                                activities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell>{new Date(activity.date).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={activity.type === "REVENUE" ? "success" : "warning"}>
                                                {activity.type === "REVENUE" ? "Recette" : "Dépense"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{activity.description || "-"}</TableCell>
                                        <TableCell className="font-medium">
                                            {activity.type === "REVENUE" ? "+" : "-"} {activity.amount.toLocaleString()} FCFA
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
