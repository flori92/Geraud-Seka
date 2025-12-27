import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { 
  X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, FileText, Image, File, Loader2
} from "lucide-react";

interface DocumentData {
  id: string;
  name: string;
  file_type: string;
  mime_type: string;
  file_url?: string;
  file_size?: number;
}

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: DocumentData | null;
}

export function DocumentViewer({ isOpen, onClose, documentData }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentData) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setRotation(0);
      setCurrentPage(1);
      
      const token = localStorage.getItem("seka_access_token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      if (documentData.file_url) {
        setFileUrl(documentData.file_url);
      } else {
        setFileUrl(`${API_BASE_URL}/api/v1/ged/documents/${documentData.id}/download?token=${token}`);
      }
      
      setLoading(false);
    }
  }, [isOpen, documentData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "ArrowLeft":
          if (currentPage > 1) setCurrentPage(p => p - 1);
          break;
        case "ArrowRight":
          if (currentPage < totalPages) setCurrentPage(p => p + 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPage, totalPages]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 25, 300));
  const handleZoomOut = () => setZoom(z => Math.max(z - 25, 25));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!window.document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl && documentData) {
      const link = window.document.createElement("a");
      link.href = fileUrl;
      link.download = documentData.name || "document";
      link.click();
    }
  };

  const isImage = documentData?.mime_type?.startsWith("image/");
  const isPdf = documentData?.mime_type?.includes("pdf") || documentData?.file_type === "pdf";
  const isPreviewable = isImage || isPdf;

  if (!isOpen || !documentData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-3">
          {isPdf ? (
            <FileText className="h-5 w-5 text-red-400" />
          ) : isImage ? (
            <Image className="h-5 w-5 text-blue-400" />
          ) : (
            <File className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-white font-medium truncate max-w-md">{documentData.name}</h3>
            <p className="text-xs text-gray-400">{documentData.file_type?.toUpperCase()}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isPreviewable && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/10"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm min-w-[60px] text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/10"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {isImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/10"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              
              <div className="w-px h-6 bg-white/20 mx-2" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/10"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Chargement du document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-white">
            <File className="h-16 w-16 text-gray-500" />
            <p className="text-red-400">{error}</p>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le fichier
            </Button>
          </div>
        ) : isImage && fileUrl ? (
          <div 
            className="transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={fileUrl}
              alt={documentData.name}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => setError("Impossible de charger l'image")}
            />
          </div>
        ) : isPdf && fileUrl ? (
          <div 
            className="w-full h-full bg-white rounded-lg overflow-hidden"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center"
            }}
          >
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full"
              title={documentData.name}
              onLoad={() => setLoading(false)}
              onError={() => setError("Impossible de charger le PDF")}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-white">
            <File className="h-24 w-24 text-gray-500" />
            <div className="text-center">
              <p className="text-lg font-medium mb-2">{documentData.name}</p>
              <p className="text-gray-400 mb-4">
                Ce type de fichier ne peut pas être prévisualisé
              </p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le fichier
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Pagination pour PDF */}
      {isPdf && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 bg-black/50 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
