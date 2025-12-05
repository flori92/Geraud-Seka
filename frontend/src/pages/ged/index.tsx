import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { 
  Folder, File, Upload, Plus, Search, Grid, List, 
  MoreVertical, Download, Trash2, Edit, Eye, Star,
  FileText, Image, FileSpreadsheet, FileArchive, Film,
  ChevronRight, Home, RefreshCw
} from "lucide-react";

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  color: string;
  document_count: number;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  is_favorite: boolean;
  folder_id: string | null;
  created_at: string;
}

interface GEDStats {
  total_documents: number;
  total_folders: number;
  total_size: number;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith("image/")) return Image;
  if (mimeType?.includes("pdf")) return FileText;
  if (mimeType?.includes("spreadsheet")) return FileSpreadsheet;
  if (mimeType?.includes("zip")) return FileArchive;
  if (mimeType?.startsWith("video/")) return Film;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function GEDPage() {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<GEDStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{id: string | null, name: string}[]>([{id: null, name: "Accueil"}]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [currentFolderId]);

  const getHeaders = () => {
    const token = localStorage.getItem("seka_access_token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      
      const foldersUrl = currentFolderId 
        ? `${API_BASE_URL}/api/v1/ged/folders?parent_id=${currentFolderId}`
        : `${API_BASE_URL}/api/v1/ged/folders`;
      const foldersRes = await fetch(foldersUrl, { headers });
      if (foldersRes.ok) setFolders(await foldersRes.json());

      const docsUrl = currentFolderId
        ? `${API_BASE_URL}/api/v1/ged/documents?folder_id=${currentFolderId}`
        : `${API_BASE_URL}/api/v1/ged/documents`;
      const docsRes = await fetch(docsUrl, { headers });
      if (docsRes.ok) setDocuments(await docsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ged/documents/stats`, { headers: getHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const navigateToFolder = (folder: DocumentFolder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const item = breadcrumb[index];
    setCurrentFolderId(item.id);
    setBreadcrumb(breadcrumb.slice(0, index + 1));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // TODO: Implement file upload
      console.log("Files dropped:", files);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  return (
    <DashboardLayout title="GED - Documents">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Documents</h1>
            <p className="text-sm text-accents-5">
              {stats && `${stats.total_documents} documents • ${stats.total_folders} dossiers • ${formatFileSize(stats.total_size)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setDragOver(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
            <Button variant="secondary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau dossier
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm overflow-x-auto">
            {breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-accents-4 mx-1" />}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`hover:text-primary transition-colors whitespace-nowrap ${
                    index === breadcrumb.length - 1 ? "font-medium text-foreground" : "text-accents-5"
                  }`}
                >
                  {index === 0 ? <Home className="h-4 w-4" /> : item.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search & View */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accents-4" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <div className="flex border rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-accents-2" : ""}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-accents-2" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        {/* Drop Zone */}
        <div
          className={`flex-1 border-2 border-dashed rounded-lg transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4" : "space-y-2 p-4"}>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className={viewMode === "grid" ? "h-32" : "h-16"} />
              ))}
            </div>
          ) : (
            <>
              {dragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 z-10">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Déposez vos fichiers ici</p>
                  </div>
                </div>
              )}

              {folders.length === 0 && documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-accents-5">
                  <Folder className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Dossier vide</p>
                  <p className="text-sm">Glissez-déposez des fichiers ou créez un nouveau dossier</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                  {/* Folders */}
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="group p-4 rounded-lg border bg-white hover:shadow-md hover:border-primary/50 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                          style={{ backgroundColor: folder.color || "#e5e7eb" }}
                        >
                          <Folder className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium text-sm truncate w-full">{folder.name}</p>
                        <p className="text-xs text-accents-5">{folder.document_count} fichiers</p>
                      </div>
                    </div>
                  ))}

                  {/* Documents */}
                  {documents.map((doc) => {
                    const FileIcon = getFileIcon(doc.mime_type);
                    return (
                      <div
                        key={doc.id}
                        className="group p-4 rounded-lg border bg-white hover:shadow-md hover:border-primary/50 cursor-pointer transition-all relative"
                      >
                        {doc.is_favorite && (
                          <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-lg bg-accents-1 flex items-center justify-center mb-2">
                            <FileIcon className="h-6 w-6 text-accents-6" />
                          </div>
                          <p className="font-medium text-sm truncate w-full">{doc.name}</p>
                          <p className="text-xs text-accents-5">{formatFileSize(doc.file_size)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y">
                  {/* Folders List */}
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="flex items-center gap-4 p-4 hover:bg-accents-1 cursor-pointer"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: folder.color || "#e5e7eb" }}
                      >
                        <Folder className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder.name}</p>
                        <p className="text-sm text-accents-5">{folder.document_count} fichiers</p>
                      </div>
                      <p className="text-sm text-accents-5">{formatDate(folder.created_at)}</p>
                    </div>
                  ))}

                  {/* Documents List */}
                  {documents.map((doc) => {
                    const FileIcon = getFileIcon(doc.mime_type);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 hover:bg-accents-1 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accents-1 flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-accents-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{doc.name}</p>
                            {doc.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-accents-5">
                            <span>{formatFileSize(doc.file_size)}</span>
                            {doc.tags?.length > 0 && (
                              <>
                                <span>•</span>
                                {doc.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-accents-5">{formatDate(doc.created_at)}</p>
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-accents-2 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-2 hover:bg-accents-2 rounded">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
