import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DocumentUpload } from "@/components/DocumentUpload";
import { getDocuments, type Document } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DocumentsPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        const token = localStorage.getItem("seka_access_token");
        if (token) {
            try {
                const data = await getDocuments(token);
                setDocuments(data);
            } catch (e) {
                console.error(e);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUploadSuccess = () => {
        fetchDocuments(); // Refresh list after upload
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "success" | "warning" | "error"; label: string }> = {
            PENDING: { variant: "default", label: "En attente" },
            OCR_PROCESSING: { variant: "warning", label: "Traitement IA" },
            OCR_COMPLETED: { variant: "success", label: "Traité" },
            VALIDATED: { variant: "success", label: "Validé" },
            REJECTED: { variant: "error", label: "Rejeté" },
        };
        const config = statusMap[status] || { variant: "default" as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <DashboardLayout title="Documents">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Gestion des Documents</h1>
                        <p className="text-sm text-accents-5">Téléchargez et gérez vos pièces comptables.</p>
                    </div>
                </div>

                <Card className="p-6">
                    <h2 className="mb-4 text-lg font-medium text-foreground">Télécharger un document</h2>
                    <DocumentUpload onUploadSuccess={handleUploadSuccess} />
                </Card>

                <Card className="overflow-hidden p-0">
                    <div className="border-b border-accents-2 px-6 py-4">
                        <h2 className="text-lg font-medium text-foreground">Documents récents</h2>
                    </div>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Fichier</TableHeader>
                                <TableHeader>Date</TableHeader>
                                <TableHeader>Montant</TableHeader>
                                <TableHeader>Statut</TableHeader>
                                <TableHeader>Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={5}>Chargement...</TableCell>
                                </TableRow>
                            ) : documents.length === 0 ? (
                                <TableRow>
                                    <TableCell className="text-center" colSpan={5}>
                                        Aucun document. Téléchargez votre première pièce ci-dessus.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{doc.filename}</div>
                                        </TableCell>
                                        <TableCell className="text-accents-5">
                                            {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            {doc.amount_ttc ? `${doc.amount_ttc.toLocaleString()} FCFA` :
                                             doc.total_amount ? `${doc.total_amount.toLocaleString()} FCFA` : "-"}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                        <TableCell>
                                            {(doc.status === "OCR_COMPLETED" || doc.status === "PENDING") && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                                >
                                                    Valider
                                                </Button>
                                            )}
                                            {doc.status === "VALIDATED" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/documents/${doc.id}/validate`)}
                                                >
                                                    Détails
                                                </Button>
                                            )}
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
