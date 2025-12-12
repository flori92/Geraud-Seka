"use client";
import React, { useEffect, useRef, useState } from 'react';

// Lazy load pdfjs-dist only on client
export default function DocumentPdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let pdfDoc: any;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        // Utiliser le CDN pour le worker - plus fiable avec Next.js
        const PDFJS_VERSION = '4.7.76';
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

        const pdf = await (pdfjsLib as any).getDocument(url).promise;
        if (cancelled) return;
        pdfDoc = pdf;
        setPageCount(pdf.numPages);

        // Render first page
        await renderPage(pdf, 1);
      } catch (e) {
        console.error('PDF load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function renderPage(pdf: any, pageNumber: number) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height as number;
      canvas.width = viewport.width as number;

      const renderTask = page.render({ canvasContext: context as any, viewport });
      await renderTask.promise;

      const mount = containerRef.current;
      if (mount) {
        mount.innerHTML = '';
        mount.appendChild(canvas);
      }
    }

    load();
    return () => {
      cancelled = true;
    }
  }, [url]);

  async function goTo(page: number) {
    setCurrentPage(page);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const pdf = await (pdfjsLib as any).getDocument(url).promise;
      await (async () => {
        const p = await pdf.getPage(page);
        const viewport = p.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height as number;
        canvas.width = viewport.width as number;
        const renderTask = p.render({ canvasContext: context as any, viewport });
        await renderTask.promise;
        const mount = containerRef.current;
        if (mount) {
          mount.innerHTML = '';
          mount.appendChild(canvas);
        }
      })();
    } catch (e) {
      console.error('PDF nav error', e);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{loading ? 'Chargement…' : `Page ${currentPage}/${pageCount}`}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => currentPage > 1 && goTo(currentPage - 1)} className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage <= 1}>Précédent</button>
          <button onClick={() => currentPage < pageCount && goTo(currentPage + 1)} className="px-2 py-1 border rounded disabled:opacity-50" disabled={currentPage >= pageCount}>Suivant</button>
        </div>
      </div>
      <div ref={containerRef} className="w-full overflow-auto border rounded" style={{ maxHeight: 600 }} />
    </div>
  );
}
