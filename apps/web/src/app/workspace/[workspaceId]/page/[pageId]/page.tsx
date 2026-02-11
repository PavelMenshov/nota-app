'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAppStore } from '@/lib/store';
import { pagesApi, docApi, aiApi, sourcesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <Button variant="ghost" size="sm" onClick={() => setShowAIModal(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
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
            <div className="max-w-4xl mx-auto p-8">
              <textarea
                className="w-full min-h-[500px] p-4 text-lg leading-relaxed resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Start writing your notes here..."
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="canvas" className="flex-1 m-0">
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <Palette className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Canvas Editor</h3>
                <p className="text-muted-foreground mt-2">
                  Interactive whiteboard coming soon.<br />
                  Will support sticky notes, shapes, connectors, and real-time collaboration.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="flex-1 m-0">
            <div className="max-w-4xl mx-auto p-8">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">PDF Sources</h3>
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
                      Upload PDF
                    </>
                  )}
                </Button>
              </div>

              {page.sources.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <Files className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h4 className="mt-4 font-medium">No sources yet</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload PDFs to annotate and reference in your notes
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {page.sources.map((source) => (
                    <div key={source.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Files className="h-8 w-8 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/api/sources/files/${source.fileUrl.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-primary"
                        >
                          {source.fileName}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          {source.pageCount ? `${source.pageCount} pages` : 'PDF document'}
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
                  ))}
                </div>
              )}
            </div>
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
                Generate summaries or flashcards from your page content
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
