import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Eye, Download, Truck } from "lucide-react";

export default function DeliveryNotesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for now - will be connected to API when backend is ready
  const deliveryNotes = [
    { id: "BL001", client: "Client A", date: "2025-11-21", items_count: 5, status: "Livré" },
    { id: "BL002", client: "Client B", date: "2025-11-22", items_count: 3, status: "En transit" },
    { id: "BL003", client: "Client C", date: "2025-11-20", items_count: 8, status: "En préparation" },
    { id: "BL004", client: "Client D", date: "2025-11-23", items_count: 2, status: "Livré" },
  ];

  const stats = [
    { label: "Total BL", value: deliveryNotes.length.toString(), color: "bg-blue-600" },
    { label: "Livrés", value: deliveryNotes.filter(d => d.status === "Livré").length.toString(), color: "bg-green-600" },
    { label: "En transit", value: deliveryNotes.filter(d => d.status === "En transit").length.toString(), color: "bg-orange-600" },
    { label: "En préparation", value: deliveryNotes.filter(d => d.status === "En préparation").length.toString(), color: "bg-purple-600" },
  ];

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "error" => {
    const variants: Record<string, "default" | "success" | "warning" | "error"> = {
      "En préparation": "default",
      "En transit": "warning",
      "Livré": "success",
      "Annulé": "error",
    };
    return variants[status] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "En préparation": "bg-gray-100 text-gray-700",
      "En transit": "bg-orange-100 text-orange-700",
      "Livré": "bg-green-100 text-green-700",
      "Annulé": "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardLayout title="Bons de livraison">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-accents-6">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <Input
              placeholder="Rechercher un bon de livraison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select>
              <option value="all">Tous les statuts</option>
              <option value="preparation">En préparation</option>
              <option value="transit">En transit</option>
              <option value="livre">Livré</option>
            </Select>
          </div>
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau BL
          </Button>
        </div>
      </Card>

      {/* Delivery Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliveryNotes.map((note) => (
          <Card key={note.id} hoverable>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accents-2 p-3">
                    <Truck className="h-5 w-5 text-accents-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{note.id}</h3>
                    <p className="text-sm text-accents-5">{note.client}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between border-t border-accents-2 pt-3">
                <div>
                  <p className="text-xs text-accents-5">Date livraison</p>
                  <p className="font-medium text-foreground">
                    {new Date(note.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-accents-5">Articles</p>
                  <p className="font-medium text-foreground">{note.items_count}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between border-t border-accents-2 pt-3">
                <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getStatusColor(note.status)}`}>
                  <Truck className="h-3 w-3" />
                  {note.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Eye className="mr-1 h-4 w-4" />
                  Voir
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
