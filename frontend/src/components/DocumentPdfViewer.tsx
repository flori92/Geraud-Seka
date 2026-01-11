"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentPdfViewerProps {
  url: string;
  onPageChange?: (page: number) => void;
  enableTextSelection?: boolean;
}

export default function DocumentPdfViewer({ 
  url, 
  onPageChange,
  enableTextSelection = false 
}: DocumentPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const pdfDocRef = useRef<any>(null);

  // Render page with current scale and rotation
  const renderPage = useCallback(async (pdf: any, pageNumber: number, currentScale: number, currentRotation: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: currentScale, rotation: currentRotation });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({ canvasContext: context as any, viewport });
      await renderTask.promise;

      const mount = containerRef.current;
      if (mount) {
        mount.innerHTML = '';
        mount.appendChild(canvas);
      }
    } catch (e) {
      console.error('PDF render error', e);
    }
  }, []);

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const PDFJS_VERSION = '4.7.76';
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

        const pdf = await (pdfjsLib as any).getDocument(url).promise;
        if (cancelled) return;
        
        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        await renderPage(pdf, 1, scale, rotation);
      } catch (e) {
        console.error('PDF load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, renderPage, scale, rotation]);

  // Re-render when scale or rotation changes
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderPage(pdfDocRef.current, currentPage, scale, rotation);
    }
  }, [scale, rotation, currentPage, loading, renderPage]);

  // Navigate to page
  const goTo = useCallback(async (page: number) => {
    if (page < 1 || page > pageCount) return;
    setCurrentPage(page);
    if (onPageChange) onPageChange(page);
    if (pdfDocRef.current) {
      await renderPage(pdfDocRef.current, page, scale, rotation);
    }
  }, [pageCount, onPageChange, renderPage, scale, rotation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          goTo(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          goTo(currentPage + 1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setScale(s => Math.min(s + 0.2, 3));
          break;
        case '-':
          e.preventDefault();
          setScale(s => Math.max(s - 0.2, 0.5));
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setRotation(r => (r + 90) % 360);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, goTo]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(s => Math.max(0.5, Math.min(3, s + delta)));
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            {loading ? 'Chargement…' : `Page ${currentPage} / ${pageCount}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Navigation */}
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Page précédente (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= pageCount}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Page suivante (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Zoom */}
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            disabled={scale <= 0.5}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30"
            title="Zoom arrière (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.2))}
            disabled={scale >= 3}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30"
            title="Zoom avant (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-600 mx-1" />

          {/* Rotation */}
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Rotation (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Plein écran (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className={`flex-1 overflow-auto bg-gray-600 flex items-center justify-center ${
          enableTextSelection ? 'select-text' : 'select-none'
        }`}
        style={{ cursor: loading ? 'wait' : 'default' }}
      >
        {loading && (
          <div className="text-gray-400 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p>Chargement du document...</p>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      {!isFullscreen && (
        <div className="px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 flex gap-4 flex-shrink-0">
          <span>← → : Navigation</span>
          <span>+ - : Zoom</span>
          <span>R : Rotation</span>
          <span>F : Plein écran</span>
          <span>Ctrl+Molette : Zoom</span>
        </div>
      )}
    </div>
  );
}
