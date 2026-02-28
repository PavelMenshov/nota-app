'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Plus, Save, Pencil, Eye, Upload, Paperclip, Trash2, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtime } from '@/hooks/use-realtime';
import { useAuthStore } from '@/lib/store';
import { workspacesApi, pagesApi, docApi, sourcesApi, aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor, defaultDoc, isProseMirrorDoc } from '@/components/editor/RichTextEditor';
import type { JSONContent } from '@tiptap/react';

interface PageData {
  id: string;
  title: string;
  icon: string | null;
}

interface SourceData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount: number | null;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  pages: PageData[];
}

interface OpenTab {
  id: string;
  type: 'page';
  title: string;
  pageId: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [pageContents, setPageContents] = useState<
    Record<string, { title: string; docContent: JSONContent | null; plainText: string; sources: SourceData[] }>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [docPreviewPageId, setDocPreviewPageId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiFlashcards, setAiFlashcards] = useState<Array<{ id: string; front: string; back: string }> | null>(null);
  const [aiLoading, setAiLoading] = useState<'summary' | 'flashcards' | null>(null);

  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const { connected: realtimeConnected, presenceUsers } = useRealtime({
    pageId: activeTab?.type === 'page' ? activeTab.pageId : '',
    token,
    onDocUpdate: undefined,
    onCanvasUpdate: undefined,
  });

  useEffect(() => {
    setAiSummary(null);
    setAiFlashcards(null);
  }, [activeTab?.pageId]);

  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    try {
      const data = await workspacesApi.get(token, workspaceId);
      setWorkspace({
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        pages: data.pages ?? [],
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to load workspace', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [token, workspaceId, toast]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadWorkspace();
  }, [workspaceId, isAuthenticated, router, loadWorkspace]);

  const openTab = useCallback((tab: OpenTab) => {
    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.id === tab.id);
      if (exists) return prev;
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  }, []);

  const loadPageContent = useCallback(
    async (pageId: string) => {
      if (!token) return;
      try {
        const pageData = await pagesApi.get(token, pageId);
        const doc = pageData.doc;
        const plainText = doc?.plainText ?? '';
        const rawContent = doc?.content;
        const docContent = isProseMirrorDoc(rawContent)
          ? rawContent
          : defaultDoc(plainText);
        setPageContents((prev) => ({
          ...prev,
          [pageId]: {
            title: pageData.title,
            docContent,
            plainText,
            sources: (pageData.sources || []) as SourceData[],
          },
        }));
        openTab({
          id: `page-${pageId}`,
          type: 'page',
          title: pageData.title,
          pageId,
        });
      } catch {
        toast({ title: 'Error', description: 'Failed to load page', variant: 'destructive' });
      }
    },
    [token, openTab, toast]
  );

  const handleSavePage = async (pageId: string) => {
    if (!token) return;
    const content = pageContents[pageId];
    if (!content) return;
    setIsSaving(true);
    try {
      await pagesApi.update(token, pageId, { title: content.title });
      await docApi.update(token, pageId, {
        content: content.docContent ?? defaultDoc(content.plainText),
        plainText: content.plainText,
      });
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.pageId === pageId && t.type === 'page' ? { ...t, title: content.title } : t
        )
      );
      toast({ title: 'Saved!' });
      loadWorkspace();
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttachFile = () => {
    if (activeTab?.type !== 'page' || !activeTab.pageId) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || activeTab?.type !== 'page' || !activeTab.pageId) return;
    e.target.value = '';
    setIsUploadingFile(true);
    try {
      const result = await sourcesApi.upload(token, activeTab.pageId, file);
      setPageContents((prev) => {
        const cur = prev[activeTab.pageId];
        if (!cur) return prev;
        return {
          ...prev,
          [activeTab.pageId]: {
            ...cur,
            sources: [...cur.sources, { ...result, pageCount: null }],
          },
        };
      });
      toast({ title: 'File attached' });
    } catch {
      toast({ title: 'Error', description: 'Only PDF, DOCX, and PPTX are allowed', variant: 'destructive' });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveSource = async (pageId: string, sourceId: string) => {
    if (!token) return;
    try {
      await sourcesApi.delete(token, pageId, sourceId);
      setPageContents((prev) => {
        const cur = prev[pageId];
        if (!cur) return prev;
        return {
          ...prev,
          [pageId]: { ...cur, sources: cur.sources.filter((s) => s.id !== sourceId) },
        };
      });
      toast({ title: 'File removed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove file', variant: 'destructive' });
    }
  };

  const handleCreatePage = async () => {
    if (!token) return;
    setIsCreatingPage(true);
    try {
      const data = await pagesApi.create(token, {
        workspaceId,
        title: newPageTitle.trim() || 'Untitled',
      });
      setShowCreatePageModal(false);
      setNewPageTitle('');
      await loadWorkspace();
      await loadPageContent(data.id);
      toast({ title: 'Page created' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create page', variant: 'destructive' });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleAiSummary = async (pageId: string) => {
    if (!token) return;
    setAiLoading('summary');
    setAiSummary(null);
    try {
      const res = await aiApi.summary(token, pageId, { includeDoc: true, includeSources: true });
      setAiSummary(res.summary);
    } catch {
      toast({ title: 'Error', description: 'AI summary failed', variant: 'destructive' });
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiFlashcards = async (pageId: string) => {
    if (!token) return;
    setAiLoading('flashcards');
    setAiFlashcards(null);
    try {
      const res = await aiApi.flashcards(token, pageId, { count: 8 });
      setAiFlashcards(res.flashcardSet.cards.map((c) => ({ id: c.id, front: c.front, back: c.back })));
    } catch {
      toast({ title: 'Error', description: 'AI flashcards failed', variant: 'destructive' });
    } finally {
      setAiLoading(null);
    }
  };

  if (!isAuthenticated()) return null;
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Workspace not found.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center gap-4 border-b px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="truncate text-lg font-semibold">{workspace.name}</h1>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r p-2">
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-sm font-medium text-muted-foreground">Pages</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="New page"
              onClick={() => setShowCreatePageModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-0.5">
            {workspace.pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => loadPageContent(page.id)}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{page.title || 'Untitled'}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col min-h-0">
          {activeTab ? (
            activeTab.type === 'page' && (() => {
              const pageId = activeTab.pageId;
              const content = pageContents[pageId];
              if (!content) {
                return (
                  <div className="flex flex-1 items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                );
              }
              const isPreview = docPreviewPageId === pageId;
              return (
                <div className="flex flex-col h-full">
                  <header className="border-b sticky top-0 bg-background z-10">
                    <div className="flex h-12 items-center justify-between px-6">
                      <Input
                        value={content.title}
                        onChange={(e) =>
                          setPageContents((prev) => ({
                            ...prev,
                            [pageId]: { ...prev[pageId], title: e.target.value },
                          }))
                        }
                        className="max-w-lg border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0 h-auto"
                        placeholder="Untitled"
                      />
                      <div className="flex items-center gap-2">
                        {realtimeConnected && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Collaborative editing">
                            <Users className="h-3.5 w-3.5" />
                            {presenceUsers.length > 0 ? `${presenceUsers.length + 1} online` : 'Connected'}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={showAiPanel ? 'default' : 'outline'}
                          className="h-8"
                          onClick={() => setShowAiPanel((v) => !v)}
                          title="AI assistant"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          AI
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          className="hidden"
                          onChange={onFileSelected}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          title="Attach file (PDF, DOCX, PPTX)"
                          onClick={handleAttachFile}
                          disabled={isUploadingFile}
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          {isUploadingFile ? 'Uploading...' : 'Attach File'}
                        </Button>
                        <Button
                          size="sm"
                          variant={isPreview ? 'outline' : 'default'}
                          className="h-8"
                          onClick={() =>
                            setDocPreviewPageId((id) => (id === pageId ? null : pageId))
                          }
                        >
                          {isPreview ? (
                            <><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</>
                          ) : (
                            <><Eye className="mr-1 h-3.5 w-3.5" /> Preview</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSavePage(pageId)}
                          disabled={isSaving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </header>
                  {content.sources.length > 0 && (
                    <div className="border-b px-6 py-2 flex flex-wrap items-center gap-2 bg-muted/30">
                      <span className="text-xs font-medium text-muted-foreground mr-2">Attachments</span>
                      {content.sources.map((src) => (
                        <span
                          key={src.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-background border px-2 py-1 text-sm"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <a
                            href={src.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate max-w-[180px]"
                          >
                            {src.fileName}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveSource(pageId, src.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            title="Remove file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {showAiPanel && (
                    <div className="border-b bg-muted/30 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAiSummary(pageId)}
                          disabled={!!aiLoading}
                        >
                          {aiLoading === 'summary' ? 'Loading...' : 'Summary'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAiFlashcards(pageId)}
                          disabled={!!aiLoading}
                        >
                          {aiLoading === 'flashcards' ? 'Loading...' : 'Flashcards'}
                        </Button>
                      </div>
                      {aiSummary && (
                        <div className="text-sm rounded-md bg-background p-3 mb-2 max-h-40 overflow-auto">
                          {aiSummary}
                        </div>
                      )}
                      {aiFlashcards && (
                        <div className="text-sm space-y-2 max-h-48 overflow-auto">
                          {aiFlashcards.map((card) => (
                            <Card key={card.id}>
                              <CardContent className="p-2">
                                <p className="font-medium">{card.front}</p>
                                <p className="text-muted-foreground text-xs mt-1">{card.back}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 overflow-auto">
                    <div className="mx-auto max-w-4xl p-8">
                      <RichTextEditor
                        key={pageId}
                        content={content.docContent}
                        editable={!isPreview}
                        placeholder="Start writing your notes here..."
                        onChange={(json, plainText) =>
                          setPageContents((prev) => ({
                            ...prev,
                            [pageId]: { ...prev[pageId], docContent: json, plainText },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Open a page from the sidebar
            </div>
          )}
        </main>
      </div>

      {showCreatePageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">New page</h3>
              <Input
                placeholder="Page title"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreatePageModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreatePage} disabled={isCreatingPage}>
                  {isCreatingPage ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
