'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Plus, Save, Pencil, Eye, Upload, Paperclip, Trash2, Sparkles, Users, FolderPlus, Folder, UserPlus, Link2, LayoutPanelTop, PenTool, FileStack, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtime } from '@/hooks/use-realtime';
import { useAuthStore } from '@/lib/store';
import { workspacesApi, pagesApi, docApi, canvasApi, sourcesApi, aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor, defaultDoc, isProseMirrorDoc } from '@/components/editor/RichTextEditor';
import CanvasEditor, { type CanvasState } from '@/components/canvas/CanvasEditor';
import PDFViewer from '@/components/pdf/PDFViewer';
import type { JSONContent } from '@tiptap/react';

type PageMode = 'doc' | 'canvas' | 'sources';

interface PageData {
  id: string;
  title: string;
  icon: string | null;
  parentId?: string | null;
  doc?: { id: string } | null;
  canvas?: { id: string } | null;
}

interface SourceData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount: number | null;
}

interface WorkspaceMember {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}
interface Workspace {
  id: string;
  name: string;
  description: string | null;
  pages: PageData[];
  members?: WorkspaceMember[];
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
  const { token, isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [pageContents, setPageContents] = useState<
    Record<string, {
      title: string;
      docContent: JSONContent | null;
      plainText: string;
      sources: SourceData[];
      canvasContent: CanvasState | null;
    }>
  >({});
  const [pageMode, setPageMode] = useState<PageMode>('doc');
  const [isSaving, setIsSaving] = useState(false);
  const [docPreviewPageId, setDocPreviewPageId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sourceAnnotations, setSourceAnnotations] = useState<Record<string, Array<{ id: string; type: string; content: string | null; color: string | null; pageNumber: number; selectedText: string | null; position: unknown; user?: { id: string; name: string | null; email: string } }>>>({});
  const currentMember = workspace?.members?.find((m) => m.user?.id === user?.id);
  const canEditSources = currentMember ? currentMember.role !== 'VIEWER' : false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [pageActivity, setPageActivity] = useState<Array<{ id: string; action: string; details: unknown; createdAt: string; user: { id: string; name: string | null; email: string } }>>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
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
    setSelectedSourceId(null);
  }, [activeTab?.pageId]);

  // Load annotations when a PDF source is selected (Sources tab)
  useEffect(() => {
    if (!token || !activeTab?.pageId || activeTab.type !== 'page' || !selectedSourceId) return;
    const sources = pageContents[activeTab.pageId]?.sources ?? [];
    const src = sources.find((s) => s.id === selectedSourceId);
    if (!src || src.mimeType !== 'application/pdf') return;
    sourcesApi
      .getWithAnnotations(token, activeTab.pageId, selectedSourceId)
      .then((res) => setSourceAnnotations((prev) => ({ ...prev, [selectedSourceId]: res.annotations })))
      .catch(() => {
        toast({ title: 'Could not load annotations', variant: 'destructive' });
      });
  }, [token, activeTab?.pageId, activeTab?.type, selectedSourceId, pageContents, toast]);

  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    try {
      const data = await workspacesApi.get(token, workspaceId);
      setWorkspace({
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        pages: (data.pages ?? []).map((p: PageData) => ({
          id: p.id,
          title: p.title,
          icon: p.icon ?? null,
          parentId: p.parentId ?? null,
          doc: p.doc ?? null,
          canvas: p.canvas ?? null,
        })),
        members: data.members ?? [],
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
        if (!pageData.doc) {
          toast({ title: 'This is a folder', description: 'Open a page inside it.', variant: 'default' });
          return;
        }
        const doc = pageData.doc;
        const plainText = doc?.plainText ?? '';
        const rawContent = doc?.content;
        const docContent = isProseMirrorDoc(rawContent)
          ? rawContent
          : defaultDoc(plainText);
        const rawCanvas = pageData.canvas?.content as CanvasState | undefined;
        const canvasContent: CanvasState =
          rawCanvas && Array.isArray(rawCanvas?.elements)
            ? { elements: rawCanvas.elements, viewport: rawCanvas.viewport ?? { x: 0, y: 0, zoom: 1 } }
            : { elements: [], viewport: { x: 0, y: 0, zoom: 1 } };
        setPageContents((prev) => ({
          ...prev,
          [pageId]: {
            title: pageData.title,
            docContent,
            plainText,
            sources: (pageData.sources || []) as SourceData[],
            canvasContent,
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
        parentId: newPageParentId || undefined,
      });
      setShowCreatePageModal(false);
      setNewPageTitle('');
      setNewPageParentId(null);
      await loadWorkspace();
      await loadPageContent(data.id);
      toast({ title: 'Page created' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create page', variant: 'destructive' });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!token) return;
    setIsCreatingFolder(true);
    try {
      await pagesApi.create(token, {
        workspaceId,
        title: newFolderTitle.trim() || 'New folder',
        parentId: undefined,
        isFolder: true,
      });
      setShowCreateFolderModal(false);
      setNewFolderTitle('');
      await loadWorkspace();
      toast({ title: 'Folder created' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create folder', variant: 'destructive' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleAddMember = async () => {
    if (!token || !inviteEmail.trim()) return;
    setIsAddingMember(true);
    try {
      await workspacesApi.addMember(token, workspaceId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      await loadWorkspace();
      toast({ title: 'Invitation sent' });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to add member';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!token) return;
    try {
      await workspacesApi.updateMemberRole(token, workspaceId, memberId, newRole);
      await loadWorkspace();
      toast({ title: 'Role updated' });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to update role';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleCopyShareLink = async () => {
    if (!token) return;
    try {
      const res = await workspacesApi.generateShareLink(token, workspaceId);
      const origin = typeof globalThis.window === 'undefined' ? '' : globalThis.window.location.origin;
      const url = origin ? `${origin}/join/${res.shareLink}` : '';
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate link', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!showActivityModal || !token || !activeTab?.pageId) return;
    setLoadingActivity(true);
    pagesApi
      .getActivity(token, activeTab.pageId)
      .then(setPageActivity)
      .catch(() => toast({ title: 'Error', description: 'Failed to load history', variant: 'destructive' }))
      .finally(() => setLoadingActivity(false));
  }, [showActivityModal, token, activeTab?.pageId, toast]);

  const formatActivityAction = (action: string, details: unknown): string => {
    const d = details as { title?: string; fileName?: string } | null;
    switch (action) {
      case 'created':
        return d?.title ? `Created page "${d.title}"` : 'Created page';
      case 'updated':
        return d?.title ? `Renamed to "${d.title}"` : 'Updated page';
      case 'edited_doc':
        return 'Edited document';
      case 'edited_canvas':
        return 'Edited canvas';
      case 'restored_snapshot':
        return 'Restored doc version';
      case 'restored_canvas_snapshot':
        return 'Restored canvas version';
      case 'uploaded_source':
        return d?.fileName ? `Uploaded "${d.fileName}"` : 'Uploaded file';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const formatRelativeTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString();
  };

  const handleCopyPageShareLink = async () => {
    if (!token || activeTab?.type !== 'page' || !activeTab.pageId) return;
    try {
      const res = await pagesApi.generateShareLink(token, activeTab.pageId);
      const origin = typeof globalThis.window === 'undefined' ? '' : globalThis.window.location.origin;
      const url = origin ? `${origin}/share/${res.shareLink}` : '';
      await navigator.clipboard.writeText(url);
      toast({ title: 'Page link copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate page link', variant: 'destructive' });
    }
  };

  const handleSaveCanvas = async (pageId: string, content: CanvasState) => {
    if (!token) return;
    setIsSaving(true);
    try {
      await canvasApi.update(token, pageId, { content });
      setPageContents((prev) => ({
        ...prev,
        [pageId]: { ...prev[pageId], canvasContent: content },
      }));
      toast({ title: 'Canvas saved' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save canvas', variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
        <h1 className="truncate text-lg font-semibold flex-1">{workspace.name}</h1>
        <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Invite
        </Button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r p-2">
          <div className="flex items-center justify-between gap-2 py-2">
            <span className="text-sm font-medium text-muted-foreground">Pages</span>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="New folder"
                onClick={() => { setNewFolderTitle(''); setShowCreateFolderModal(true); }}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="New page"
                onClick={() => { setNewPageParentId(null); setNewPageTitle(''); setShowCreatePageModal(true); }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ul className="space-y-0.5">
            {(() => {
              const roots = workspace.pages.filter((p) => !p.parentId);
              const getChildren = (id: string) => workspace.pages.filter((p) => p.parentId === id);
              return roots.map((page) => {
                const children = getChildren(page.id);
                const isFolder = children.length > 0 || !page.doc;
                const openPage = () => {
                  if (!isFolder) loadPageContent(page.id);
                };
                return (
                  <li key={page.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={openPage}
                    >
                      {isFolder ? <Folder className="h-4 w-4 shrink-0 text-muted-foreground" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{page.title || 'Untitled'}</span>
                    </button>
                    {children.length > 0 && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-muted pl-2">
                        {children.map((child) => {
                          const childIsFolder = getChildren(child.id).length > 0 || !child.doc;
                          return (
                            <li key={child.id}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  if (!childIsFolder) loadPageContent(child.id);
                                }}
                              >
                                {childIsFolder ? <Folder className="h-4 w-4 shrink-0 text-muted-foreground" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className="truncate">{child.title || 'Untitled'}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              });
            })()}
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
              const sources = content.sources ?? [];
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
                          <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Who is viewing">
                            <Users className="h-3.5 w-3.5" />
                            {presenceUsers.length === 0 ? 'Connected' : `${presenceUsers.length} online`}
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
                          variant="ghost"
                          className="h-8"
                          onClick={() => setShowActivityModal(true)}
                          title="Page history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={handleCopyPageShareLink}
                          title="Copy page share link"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                        {(pageMode === 'doc' || pageMode === 'sources') && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Attach file (PDF, DOCX, PPTX)"
                            onClick={handleAttachFile}
                            disabled={isUploadingFile}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            {isUploadingFile ? 'Uploading...' : 'Attach'}
                          </Button>
                        )}
                        {pageMode === 'doc' && (
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
                        )}
                        {(pageMode === 'doc' || pageMode === 'canvas') && (
                          <Button
                            size="sm"
                            onClick={() =>
                              pageMode === 'doc'
                                ? handleSavePage(pageId)
                                : handleSaveCanvas(pageId, content.canvasContent ?? { elements: [], viewport: { x: 0, y: 0, zoom: 1 } })
                            }
                            disabled={isSaving}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex border-b bg-muted/30 px-6 gap-0">
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${pageMode === 'doc' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setPageMode('doc')}
                      >
                        <LayoutPanelTop className="inline h-4 w-4 mr-1.5 align-middle" />
                        Doc
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${pageMode === 'canvas' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setPageMode('canvas')}
                      >
                        <PenTool className="inline h-4 w-4 mr-1.5 align-middle" />
                        Canvas
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${pageMode === 'sources' ? 'border-primary text-primary bg-background' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setPageMode('sources')}
                      >
                        <FileStack className="inline h-4 w-4 mr-1.5 align-middle" />
                        Sources
                      </button>
                    </div>
                  </header>
                  {pageMode === 'doc' && sources.length > 0 && (
                    <div className="border-b px-6 py-2 flex flex-wrap items-center gap-2 bg-muted/30">
                      <span className="text-xs font-medium text-muted-foreground mr-2">Attachments</span>
                      {sources.map((src) => (
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
                  {pageMode === 'doc' && showAiPanel && (
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
                  {pageMode === 'doc' && (
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
                  )}
                  {pageMode === 'canvas' && (
                    <div className="flex-1 min-h-0 overflow-hidden min-h-[72vh]">
                      <CanvasEditor
                        key={`canvas-${pageId}`}
                        initialContent={content.canvasContent}
                        onSave={(c) =>
                          setPageContents((prev) => ({
                            ...prev,
                            [pageId]: { ...prev[pageId], canvasContent: c },
                          }))
                        }
                      />
                    </div>
                  )}
                  {pageMode === 'sources' && (
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                      <div className="w-64 shrink-0 border-r overflow-auto p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">PDF &amp; files</p>
                        {sources.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No files. Use Attach to add PDF, DOCX, PPTX.</p>
                        ) : (
                          <ul className="space-y-1">
                            {sources.map((src) => (
                              <li key={src.id}>
                                <button
                                  type="button"
                                  className={`w-full text-left rounded px-2 py-1.5 text-sm truncate ${selectedSourceId === src.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                  onClick={() => setSelectedSourceId(src.id)}
                                >
                                  <Paperclip className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                  {src.fileName}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex-1 min-h-0 overflow-auto p-4">
                        {selectedSourceId && (() => {
                          const src = sources.find((s) => s.id === selectedSourceId);
                          if (!src || !token) return null;
                          const isPdf = src.mimeType === 'application/pdf';
                          const anns = sourceAnnotations[src.id] ?? [];
                          return isPdf ? (
                            <PDFViewer
                              sourceId={src.id}
                              pageId={pageId}
                              fileName={src.fileName}
                              fileUrl={src.fileUrl}
                              pageCount={src.pageCount}
                              accessToken={token}
                              canEdit={canEditSources}
                              annotations={anns.map((a) => ({ ...a, position: a.position as { x: number; y: number; width?: number; height?: number } | null }))}
                              onCreateAnnotation={async (data) => {
                                try {
                                  await sourcesApi.createAnnotation(token, src.id, data);
                                  const res = await sourcesApi.getWithAnnotations(token, pageId, src.id);
                                  setSourceAnnotations((prev) => ({ ...prev, [src.id]: res.annotations }));
                                } catch (err) {
                                  toast({
                                    title: 'Could not add annotation',
                                    description: err instanceof Error ? err.message : 'You may need editor access.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                              onDeleteAnnotation={async (id) => {
                                try {
                                  await sourcesApi.deleteAnnotation(token, id);
                                  setSourceAnnotations((prev) => ({ ...prev, [src.id]: (prev[src.id] ?? []).filter((a) => a.id !== id) }));
                                } catch (err) {
                                  toast({
                                    title: 'Could not delete annotation',
                                    description: err instanceof Error ? err.message : 'Try again.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-8 w-8 text-muted-foreground" />
                              <a href={src.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {src.fileName}
                              </a>
                              <span className="text-muted-foreground text-sm">(open in new tab)</span>
                            </div>
                          );
                        })()}
                        {!selectedSourceId && sources.length > 0 && (
                          <p className="text-muted-foreground text-sm">Select a file from the list to view.</p>
                        )}
                      </div>
                    </div>
                  )}
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
              <div>
                <label htmlFor="new-page-parent" className="text-xs text-muted-foreground">Folder (optional)</label>
                <select
                  id="new-page-parent"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPageParentId ?? ''}
                  onChange={(e) => setNewPageParentId(e.target.value || null)}
                >
                  <option value="">None</option>
                  {workspace.pages.filter((p) => !p.parentId).map((p) => (
                    <option key={p.id} value={p.id}>{p.title || 'Untitled'}</option>
                  ))}
                </select>
              </div>
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

      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">New folder</h3>
              <Input
                placeholder="Folder name"
                value={newFolderTitle}
                onChange={(e) => setNewFolderTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateFolderModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateFolder} disabled={isCreatingFolder}>
                  {isCreatingFolder ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showActivityModal && activeTab?.pageId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Page history"
          onClick={() => setShowActivityModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowActivityModal(false)}
          tabIndex={-1}
        >
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 flex flex-col min-h-0">
              <h3 className="font-semibold text-lg mb-4">Page history</h3>
              <p className="text-sm text-muted-foreground mb-3">Who changed what and when (last 50 events).</p>
              {loadingActivity && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {!loadingActivity && pageActivity.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
              )}
              {!loadingActivity && pageActivity.length > 0 && (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
                  {pageActivity.map((a) => (
                    <li key={a.id} className="text-sm border-b border-border/50 pb-2 last:border-0">
                      <span className="font-medium text-foreground">{a.user.name || a.user.email}</span>
                      <span className="text-muted-foreground"> — {formatActivityAction(a.action, a.details)}</span>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(a.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => setShowActivityModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Invite to workspace</h3>
              {workspace.members && workspace.members.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Members</span>
                  {workspace.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate" title={m.user.email}>
                        {m.user.email}
                        {m.user.id === user?.id && (
                          <span className="ml-1 text-muted-foreground">(you)</span>
                        )}
                      </span>
                      {currentMember?.role === 'OWNER' ? (
                        <select
                          className="rounded-md border border-input bg-background px-2 py-1 text-xs w-24"
                          value={m.role}
                          onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                        >
                          <option value="OWNER">Owner</option>
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-muted-foreground capitalize">{m.role.toLowerCase()}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm w-28"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <Button onClick={handleAddMember} disabled={!inviteEmail.trim() || isAddingMember}>
                  {isAddingMember ? 'Adding...' : 'Add'}
                </Button>
              </div>
              <div className="border-t pt-4">
                <Button variant="outline" className="w-full" onClick={handleCopyShareLink}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy share link
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Anyone with the link can join as viewer.</p>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setShowInviteModal(false)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
