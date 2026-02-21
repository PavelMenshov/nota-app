'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  FileText,
  Palette,
  Files,
  Save,
  Share2,
  Download,
  Sparkles,
  Upload,
  Trash2,
  Pencil,
  Bookmark,
  BookmarkCheck,
  MessageSquareText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAppStore } from '@/lib/store';
import { pagesApi, docApi, aiApi, sourcesApi, canvasApi, exportApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import CanvasEditor, { CanvasState } from '@/components/canvas/CanvasEditor';
import PDFViewer from '@/components/pdf/PDFViewer';
import DocumentViewer from '@/components/pdf/DocumentViewer';
import DrawingCanvas from '@/components/notes/DrawingCanvas';
import { useRealtime } from '@/hooks/use-realtime';

interface PageData {
  id: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  workspaceId: string;
  doc: { id: string; content: unknown; plainText: string | null } | null;
  canvas: { id: string; content: unknown } | null;
  sources: Array<{ id: string; fileName: string; fileUrl: string; pageCount: number | null }>;
}

export default function PageEditorPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const pageId = params.pageId as string;
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { setCurrentPage } = useAppStore();
  const { toast } = useToast();

  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doc');
  const [title, setTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingSource, setIsDeletingSource] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingSource, setViewingSource] = useState<{
    id: string;
    fileName: string;
    fileUrl: string;
    pageCount: number | null;
    annotations: Array<{
      id: string;
      type: string;
      content: string | null;
      color: string | null;
      pageNumber: number;
      selectedText: string | null;
      position: { x: number; y: number } | null;
      user?: { id: string; name: string | null; email: string };
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawing overlay state
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingStrokes, setDrawingStrokes] = useState<Array<{ points: Array<{ x: number; y: number }>; color: string; width: number }>>([]);

  // Bookmarks state
  interface Bookmark { id: string; label: string; position: number; createdAt: string }
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const docTextareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Explain state
  const [selectedText, setSelectedText] = useState('');
  const [aiExplainResult, setAiExplainResult] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplainPopup, setShowExplainPopup] = useState(false);

  // Real-time collaboration
  const { connected: realtimeConnected, presenceUsers } = useRealtime({
    pageId,
    token,
  });

  // ...export handler
  const handleExport = async (format: 'PDF' | 'DOCX' | 'MARKDOWN') => {
    if (!token) return;
    setIsExporting(true);
    try {
      const job = await exportApi.create(token, format, { pageIds: [pageId] });
      toast({ title: `Export started (${format})`, description: `Job ID: ${job.id}` });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenSource = useCallback(async (sourceId: string) => {
    if (!token) return;
    try {
      const data = await sourcesApi.getWithAnnotations(token, pageId, sourceId);
      setViewingSource({
        ...data,
        annotations: data.annotations.map((a) => ({
          ...a,
          position: a.position as { x: number; y: number } | null,
        })),
      });
    } catch {
      toast({ title: 'Failed to load document', variant: 'destructive' });
    }
  }, [token, pageId, toast]);

  const handleCreateAnnotation = useCallback(async (data: {
    type: string;
    content: string;
    color: string;
    pageNumber: number;
    selectedText?: string;
    position: { x: number; y: number };
  }) => {
    if (!token || !viewingSource) return;
    try {
      await sourcesApi.createAnnotation(token, viewingSource.id, data);
      // Refresh
      await handleOpenSource(viewingSource.id);
    } catch {
      toast({ title: 'Failed to create annotation', variant: 'destructive' });
    }
  }, [token, viewingSource, handleOpenSource, toast]);

  const handleDeleteAnnotation = useCallback(async (annotationId: string) => {
    if (!token || !viewingSource) return;
    try {
      await sourcesApi.deleteAnnotation(token, annotationId);
      await handleOpenSource(viewingSource.id);
    } catch {
      toast({ title: 'Failed to delete annotation', variant: 'destructive' });
    }
  }, [token, viewingSource, handleOpenSource, toast]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadPage();
  }, [pageId, isAuthenticated, router]);

  const loadPage = async () => {
    if (!token) return;
    try {
      const data = await pagesApi.get(token, pageId);
      // Add workspaceId to the data since it's not returned from API but we have it from params
      const pageWithWorkspaceId = { ...data, workspaceId };
      setPage(pageWithWorkspaceId);
      setTitle(data.title);
      setCurrentPage({ id: data.id, title: data.title, icon: data.icon, workspaceId });
      
      // Set doc content
      if (data.doc?.plainText) {
        setDocContent(data.doc.plainText);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load page',
        variant: 'destructive',
      });
      router.push(`/workspace/${workspaceId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !page) return;
    setIsSaving(true);
    try {
      // Update title if changed
      if (title !== page.title) {
        await pagesApi.update(token, pageId, { title });
      }

      // Update doc content
      await docApi.update(token, pageId, {
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: docContent }] }] },
        plainText: docContent,
      });

      toast({ title: 'Saved!' });
      setPage({ ...page, title });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!token) return;
    setIsGeneratingAI(true);
    try {
      const result = await aiApi.summary(token, pageId);
      setAiResult(result.summary);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!token) return;
    setIsGeneratingAI(true);
    try {
      const result = await aiApi.flashcards(token, pageId, { count: 5 });
      const flashcardsText = result.flashcardSet.cards
        .map((card, i) => `${i + 1}. Q: ${card.front}\n   A: ${card.back}`)
        .join('\n\n');
      setAiResult(`Generated ${result.flashcardSet.cards.length} flashcards:\n\n${flashcardsText}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate flashcards',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Bookmark handlers
  const handleAddBookmark = () => {
    const textarea = docTextareaRef.current;
    if (!textarea) return;
    const position = textarea.selectionStart;
    const contextText = docContent.substring(
      Math.max(0, position - 30),
      Math.min(docContent.length, position + 30),
    ).trim();
    const label = contextText.length > 40 ? contextText.substring(0, 40) + '...' : contextText || `Position ${position}`;
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      label,
      position,
      createdAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [...prev, newBookmark]);
    toast({ title: 'Bookmark added' });
  };

  const handleGoToBookmark = (bookmark: Bookmark) => {
    const textarea = docTextareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(bookmark.position, bookmark.position);
    setShowBookmarks(false);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  // AI Explain handler
  const handleExplainSelection = async () => {
    if (!token || !selectedText.trim()) return;
    setIsExplaining(true);
    setShowExplainPopup(true);
    setAiExplainResult(null);
    try {
      const result = await aiApi.explain(token, pageId, { text: selectedText });
      setAiExplainResult(result.explanation);
    } catch (error) {
      setAiExplainResult(
        error instanceof Error ? error.message : 'Failed to generate explanation. Please try again.',
      );
    } finally {
      setIsExplaining(false);
    }
  };

  // Track text selection in doc textarea
  const handleDocMouseUp = () => {
    const textarea = docTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      setSelectedText(docContent.substring(start, end));
    } else {
      setSelectedText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/pages/${pageId}/sources/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({ title: 'File uploaded!' });
      loadPage();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!token) return;
    setIsDeletingSource(sourceId);
    try {
      await sourcesApi.delete(token, pageId, sourceId);
      toast({ title: 'Source deleted' });
      loadPage();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete source',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingSource(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${workspaceId}`} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0"
              placeholder="Untitled"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Presence indicators */}
            {presenceUsers.length > 0 && (
              <div className="flex items-center -space-x-2 mr-2">
                {presenceUsers.slice(0, 5).map((u) => (
                  <div
                    key={u.userId}
                    className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-background"
                    title={u.name}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {presenceUsers.length > 5 && (
                  <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs border-2 border-background">
                    +{presenceUsers.length - 5}
                  </div>
                )}
              </div>
            )}
            {realtimeConnected && (
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1" title="Connected" />
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowAIModal(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleExport('PDF')} disabled={isExporting} title="Export as PDF">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b bg-muted/30 px-4">
            <TabsList className="h-12 bg-transparent gap-4 p-0">
              <TabsTrigger
                value="doc"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Doc
              </TabsTrigger>
              <TabsTrigger
                value="canvas"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Palette className="h-4 w-4 mr-2" />
                Canvas
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Files className="h-4 w-4 mr-2" />
                Sources ({page.sources.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="doc" className="flex-1 m-0">
            <div className="max-w-4xl mx-auto p-8 relative">
              {/* Doc toolbar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Button
                  variant={isDrawingActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsDrawingActive(!isDrawingActive)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {isDrawingActive ? 'Stop Drawing' : 'Draw'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddBookmark}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Add Bookmark
                </Button>
                <Button
                  variant={showBookmarks ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBookmarks(!showBookmarks)}
                >
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  Bookmarks ({bookmarks.length})
                </Button>
                {selectedText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExplainSelection}
                    disabled={isExplaining}
                  >
                    <MessageSquareText className="h-4 w-4 mr-2" />
                    AI Explain Selection
                  </Button>
                )}
              </div>

              {/* Bookmarks panel */}
              {showBookmarks && bookmarks.length > 0 && (
                <div className="mb-4 border rounded-lg bg-muted/30 p-3">
                  <h4 className="text-sm font-medium mb-2">Bookmarks</h4>
                  <div className="space-y-1">
                    {bookmarks.map((bm) => (
                      <div key={bm.id} className="flex items-center gap-2 text-sm">
                        <button
                          className="flex-1 text-left text-primary hover:underline truncate"
                          onClick={() => handleGoToBookmark(bm)}
                        >
                          <BookmarkCheck className="h-3 w-3 inline mr-1" />
                          {bm.label}
                        </button>
                        <button
                          className="text-destructive hover:text-destructive/80 text-xs"
                          onClick={() => handleDeleteBookmark(bm.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Explain popup */}
              {showExplainPopup && (
                <div className="mb-4 border rounded-lg bg-primary/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Explanation
                    </h4>
                    <button onClick={() => { setShowExplainPopup(false); setAiExplainResult(null); }}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  {selectedText && (
                    <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
                      &ldquo;{selectedText}&rdquo;
                    </p>
                  )}
                  {isExplaining ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      <span className="text-sm text-muted-foreground">Generating explanation...</span>
                    </div>
                  ) : aiExplainResult ? (
                    <div className="text-sm whitespace-pre-wrap">{aiExplainResult}</div>
                  ) : null}
                </div>
              )}

              {/* Drawing canvas + textarea container */}
              <div className="relative">
                <DrawingCanvas
                  isActive={isDrawingActive}
                  onToggle={() => setIsDrawingActive(!isDrawingActive)}
                  strokes={drawingStrokes}
                  onStrokesChange={setDrawingStrokes}
                />
                <textarea
                  ref={docTextareaRef}
                  className="w-full min-h-[500px] p-4 text-lg leading-relaxed resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Start writing your notes here..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  onMouseUp={handleDocMouseUp}
                  onKeyUp={handleDocMouseUp}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="canvas" className="flex-1 m-0">
            <CanvasEditor
              initialContent={page.canvas?.content as CanvasState | null}
              onSave={async (content) => {
                if (!token) return;
                try {
                  await canvasApi.update(token, pageId, { content });
                } catch {
                  // silent — auto-save
                }
              }}
            />
          </TabsContent>

          <TabsContent value="sources" className="flex-1 m-0">
            {viewingSource ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                  <Button variant="ghost" size="sm" onClick={() => setViewingSource(null)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to list
                  </Button>
                </div>
                <div className="flex-1">
                  {viewingSource.fileName.match(/\.(docx|pptx)$/i) ? (
                    <DocumentViewer
                      sourceId={viewingSource.id}
                      fileName={viewingSource.fileName}
                      fileUrl={viewingSource.fileUrl}
                    />
                  ) : (
                    <PDFViewer
                      sourceId={viewingSource.id}
                      fileName={viewingSource.fileName}
                      fileUrl={viewingSource.fileUrl}
                      pageCount={viewingSource.pageCount}
                      annotations={viewingSource.annotations}
                      onCreateAnnotation={handleCreateAnnotation}
                      onDeleteAnnotation={handleDeleteAnnotation}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.pptx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Document Sources</h3>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>

                {page.sources.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Files className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h4 className="mt-4 font-medium">No sources yet</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload PDF, DOCX, or PPTX files to annotate and reference in your notes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {page.sources.map((source) => {
                      const ext = source.fileName.split('.').pop()?.toLowerCase() || '';
                      const isPdf = ext === 'pdf';
                      const isDocx = ext === 'docx' || ext === 'doc';
                      const isPptx = ext === 'pptx' || ext === 'ppt';
                      const iconColor = isPdf ? 'text-red-500' : isDocx ? 'text-blue-500' : isPptx ? 'text-orange-500' : 'text-gray-500';
                      const typeLabel = isPdf
                        ? (source.pageCount ? `${source.pageCount} pages` : 'PDF document')
                        : isDocx ? 'Word document' : isPptx ? 'PowerPoint presentation' : 'Document';
                      return (
                        <div key={source.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                          <Files className={`h-8 w-8 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <button
                              className="font-medium hover:underline text-primary text-left"
                              onClick={() => handleOpenSource(source.id)}
                            >
                              {source.fileName}
                            </button>
                            <p className="text-sm text-muted-foreground">
                              {typeLabel}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSource(source.id)}
                            disabled={isDeletingSource === source.id}
                          >
                            {isDeletingSource === source.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Study Assistant
              </CardTitle>
              <CardDescription>
                Generate summaries, flashcards, or explain selected text from your notes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingAI}
                  className="flex-1"
                >
                  Generate Summary
                </Button>
                <Button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingAI}
                  variant="outline"
                  className="flex-1"
                >
                  Generate Flashcards
                </Button>
              </div>

              {isGeneratingAI && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Generating...</p>
                </div>
              )}

              {aiResult && !isGeneratingAI && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">{aiResult}</pre>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAIModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
