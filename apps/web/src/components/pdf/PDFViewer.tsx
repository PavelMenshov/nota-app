'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/config-store';

interface Annotation {
  id: string;
  type: string;
  content: string | null;
  color: string | null;
  pageNumber: number;
  selectedText: string | null;
  position: { x: number; y: number; width?: number; height?: number } | null;
  user?: { id: string; name: string | null; email: string };
}

interface PDFViewerProps {
  sourceId: string;
  /** Required for external PDF proxy (stream endpoint) */
  pageId: string;
  fileName: string;
  fileUrl: string;
  pageCount: number | null;
  annotations: Annotation[];
  /** Pass to load PDF from protected API (iframe cannot send Authorization) */
  accessToken?: string | null;
  /** If false, hide annotation tools (VIEWER can only view) */
  canEdit?: boolean;
  onCreateAnnotation: (data: {
    type: string;
    content: string;
    color: string;
    pageNumber: number;
    selectedText?: string;
    position: { x: number; y: number };
  }) => Promise<void>;
  onDeleteAnnotation: (annotationId: string) => Promise<void>;
}

const HIGHLIGHT_COLORS = ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5', '#C4B5FD'];

function isExternalPdfUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export default function PDFViewer({
  sourceId,
  pageId,
  fileName,
  fileUrl,
  pageCount,
  annotations,
  accessToken,
  canEdit = true,
  onCreateAnnotation,
  onDeleteAnnotation,
}: PDFViewerProps) {
  void sourceId; // reserved for future use (e.g. deep links)
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [annotationMode, setAnnotationMode] = useState<'none' | 'highlight' | 'comment'>('none');
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [commentText, setCommentText] = useState('');
  const [showAnnotations] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const totalPages = pageCount || 1;

  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // Load PDF: request stream directly from API URL so Authorization is sent (rewrites may not forward it)
  useEffect(() => {
    if (!accessToken) {
      setPdfBlobUrl(null);
      setPdfLoadError('Sign in to view this file');
      return () => {};
    }

    const apiBase = getApiUrl().replace(/\/$/, '');
    const url = `${apiBase}/api/pages/${pageId}/sources/${sourceId}/stream`;
    const ac = new AbortController();
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };

    fetch(url, { signal: ac.signal, headers, mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : `Failed to load PDF: ${res.status}`);
        const contentType = res.headers.get('Content-Type') || 'application/pdf';
        if (!contentType.toLowerCase().includes('pdf') && !contentType.includes('octet-stream')) {
          throw new Error('Response is not a PDF');
        }
        return res.arrayBuffer().then((buf) => new Blob([buf], { type: 'application/pdf' }));
      })
      .then((blob) => {
        if (blob.size === 0) throw new Error('PDF is empty');
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = URL.createObjectURL(blob);
        setPdfLoadError(null);
        setPdfBlobUrl(blobUrlRef.current);
      })
      .catch((err) => {
        setPdfBlobUrl(null);
        setPdfLoadError(err instanceof Error ? err.message : 'Failed to load PDF');
      });

    return () => {
      ac.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
    };
  }, [fileUrl, accessToken, pageId, sourceId]);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (annotationMode === 'none') return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (annotationMode === 'highlight') {
        await onCreateAnnotation({
          type: 'HIGHLIGHT',
          content: '',
          color: selectedColor,
          pageNumber: currentPage,
          position: { x, y },
        });
      } else if (annotationMode === 'comment') {
        const text = commentText.trim() || 'New comment';
        await onCreateAnnotation({
          type: 'NOTE',
          content: text,
          color: selectedColor,
          pageNumber: currentPage,
          position: { x, y },
        });
        setCommentText('');
      }

      setAnnotationMode('none');
    },
    [annotationMode, selectedColor, currentPage, commentText, onCreateAnnotation],
  );

  // Blob URL only (no fragment — some browsers show blank with #page= on blob URLs)
  const pdfSrc = pdfBlobUrl ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background flex-wrap">
        <span className="text-sm font-medium truncate max-w-48">{fileName}</span>
        <div className="w-px h-5 bg-border mx-1" />

        {/* Navigation */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevPage} disabled={currentPage <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
          {currentPage} / {totalPages}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextPage} disabled={currentPage >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Zoom */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
          <ZoomOut className="h-4 w-4" />
        </Button>

        {canEdit && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            {/* Annotation tools — only for EDITOR/OWNER */}
            <Button
              variant={annotationMode === 'highlight' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAnnotationMode(annotationMode === 'highlight' ? 'none' : 'highlight')}
            >
              <Highlighter className="h-3 w-3" />
              Highlight
            </Button>
            <Button
              variant={annotationMode === 'comment' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAnnotationMode(annotationMode === 'comment' ? 'none' : 'comment')}
            >
              <MessageSquare className="h-3 w-3" />
              Comment
            </Button>

            {annotationMode !== 'none' && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`h-5 w-5 rounded-full border-2 ${selectedColor === c ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setSelectedColor(c)}
                  />
                ))}
              </>
            )}

            {annotationMode === 'comment' && (
              <input
                className="ml-2 bg-background border rounded px-2 py-0.5 text-xs w-40"
                placeholder="Comment text..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            )}

            {annotationMode !== 'none' && (
              <span className="ml-2 text-xs text-muted-foreground">Click on PDF to place</span>
            )}
          </>
        )}
      </div>

      {/* PDF Display + Annotations panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF embed area */}
        <div className="flex-1 overflow-auto bg-gray-100 relative">
          <div
            className="relative mx-auto my-4"
            style={{ width: `${zoom * 100}%`, maxWidth: `${zoom * 800}px`, minHeight: '600px' }}
            onClick={handleCanvasClick}
          >
            {pdfLoadError && !pdfSrc ? (
              <div className="flex flex-col items-center justify-center h-64 border bg-background rounded-md text-muted-foreground p-4 text-center">
                <p className="text-sm">{pdfLoadError}</p>
                <p className="text-xs mt-1">Ensure you are signed in and have access to this file.</p>
                {isExternalPdfUrl(fileUrl) && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-sm text-primary hover:underline"
                  >
                    Open PDF in new tab
                  </a>
                )}
              </div>
            ) : pdfSrc ? (
              <>
                <iframe
                  src={pdfSrc}
                  className="w-full border shadow-lg bg-white"
                  style={{ height: `${zoom * 900}px`, pointerEvents: annotationMode !== 'none' ? 'none' : 'auto' }}
                  title={fileName}
                />
                {/* Transparent overlay to catch clicks when adding highlight/comment (iframe can swallow events) */}
                {annotationMode !== 'none' && (
                  <div
                    className="absolute inset-0 z-10 cursor-crosshair"
                    style={{ minHeight: `${zoom * 900}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCanvasClick(e);
                    }}
                    aria-label="Click on PDF to place annotation"
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 border bg-background rounded-md">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {/* Annotation overlay markers */}
            {showAnnotations &&
              pageAnnotations.map((ann) => {
                const pos = ann.position as { x: number; y: number } | null;
                if (!pos) return null;
                return (
                  <div
                    key={ann.id}
                    className="absolute group"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {ann.type === 'HIGHLIGHT' ? (
                      <div
                        className="w-6 h-6 rounded-full opacity-70 border-2 border-white shadow cursor-pointer"
                        style={{ backgroundColor: ann.color || '#FDE047' }}
                        title={ann.selectedText || 'Highlight'}
                      />
                    ) : (
                      <div
                        className="px-2 py-1 rounded shadow text-xs max-w-[200px] border cursor-pointer"
                        style={{ backgroundColor: ann.color || '#FDE047' }}
                        title={ann.content || ''}
                      >
                        💬 {ann.content?.slice(0, 50) || 'Comment'}
                      </div>
                    )}
                    {canEdit && (
                      <button
                        className="hidden group-hover:flex absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white items-center justify-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAnnotation(ann.id);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Annotations sidebar */}
        {annotations.length > 0 && (
          <div className="w-64 border-l bg-background overflow-auto">
            <div className="p-3 border-b">
              <h4 className="text-sm font-medium">Annotations ({annotations.length})</h4>
            </div>
            <div className="divide-y">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3 text-xs hover:bg-muted/50 cursor-pointer ${ann.pageNumber === currentPage ? 'bg-muted/30' : ''}`}
                  onClick={() => setCurrentPage(ann.pageNumber)}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: ann.color || '#FDE047' }}
                      />
                      <span className="font-medium">
                        {ann.type === 'HIGHLIGHT' ? 'Highlight' : 'Comment'}
                      </span>
                    </span>
                    <span className="text-muted-foreground">p.{ann.pageNumber}</span>
                  </div>
                  {ann.content && (
                    <p className="mt-1 text-muted-foreground line-clamp-2">{ann.content}</p>
                  )}
                  {ann.selectedText && (
                    <p className="mt-1 italic text-muted-foreground line-clamp-2">&quot;{ann.selectedText}&quot;</p>
                  )}
                  {ann.user?.name && (
                    <p className="mt-1 text-muted-foreground">— {ann.user.name}</p>
                  )}
                  {canEdit && (
                    <button
                      className="mt-1 text-destructive hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(ann.id);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
