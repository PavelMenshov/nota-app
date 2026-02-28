'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Plus, Save, Pencil, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { workspacesApi, pagesApi, docApi } from '@/lib/api';
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

  const activeTab = openTabs.find((t) => t.id === activeTabId);

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
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Create page (not implemented in this snippet)">
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
                        <Button size="sm" variant="outline" disabled title="Attach file">
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          Attach File
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
    </div>
  );
}
