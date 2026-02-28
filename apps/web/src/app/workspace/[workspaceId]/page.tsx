'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FileText,
  ChevronLeft,
  Settings,
  Users,
  Calendar,
  CheckSquare,
  Search,
  Trash2,
  Save,
  Copy,
  LogOut,
  UserPlus,
  LinkIcon,
  X,
  Crown,
  Pencil,
  Eye,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  File,
  FileImage,
  Video,
  Mail,
  Phone,
  MessageSquare,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAppStore } from '@/lib/store';
import { workspacesApi, pagesApi, docApi, sourcesApi, authApi, exportApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/pdf/PDFViewer';
import DocumentViewer from '@/components/pdf/DocumentViewer';

type PanelView = 'members' | 'settings' | 'integrations';


interface PageData {
  id: string;
  title: string;
  icon: string | null;
  parentId?: string | null;
  sources?: SourceData[];
}

interface SourceData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageCount: number | null;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  pages: PageData[];
  members: Member[];
}

interface OpenTab {
  id: string;
  type: 'page' | 'source' | 'panel' | 'integration';
  title: string;
  pageId: string;
  sourceId?: string;
  panelView?: PanelView;
  integrationUrl?: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const { token, user, isAuthenticated, updateUser, clearAuth } = useAuthStore();
  const { setCurrentWorkspace } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState<'page' | 'folder' | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetPageId, setUploadTargetPageId] = useState<string | null>(null);

  // Tabs state
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Page editor state (per-tab)
  const [pageContents, setPageContents] = useState<Record<string, { title: string; content: string; sources: SourceData[] }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsLoadingPage] = useState(false);

  // Folder expand state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Members panel state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [isInviting, setIsInviting] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Settings panel state
  const [profileName, setProfileName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // Show add menu
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Document type for create modal
  const [newItemType, setNewItemType] = useState<'document' | 'presentation' | 'spreadsheet'>('document');

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadWorkspace();
  }, [workspaceId, isAuthenticated, router]);

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name);
      setWsDescription(workspace.description || '');
    }
  }, [workspace]);

  const loadWorkspace = async () => {
    if (!token) return;
    try {
      const data = await workspacesApi.get(token, workspaceId);
      setWorkspace(data);
      setCurrentWorkspace({ id: data.id, name: data.name, description: data.description });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load workspace',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const openTab = useCallback((tab: OpenTab) => {
    setOpenTabs((prev) => {
      const exists = prev.find((t) => t.id === tab.id);
      if (exists) return prev;
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  }, [activeTabId]);

  const loadPageContent = useCallback(async (pageId: string) => {
    if (!token) return;
    setIsLoadingPage(true);
    try {
      const pageData = await pagesApi.get(token, pageId);
      setPageContents((prev) => ({
        ...prev,
        [pageId]: {
          title: pageData.title,
          content: pageData.doc?.plainText || '',
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
      toast({
        title: 'Error',
        description: 'Failed to load page',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPage(false);
    }
  }, [token, toast, openTab]);

  const openSourceTab = useCallback((source: SourceData, pageId: string) => {
    openTab({
      id: `source-${source.id}`,
      type: 'source',
      title: source.fileName,
      pageId,
      sourceId: source.id,
    });
  }, [openTab]);

  const openPanelTab = useCallback((panelView: PanelView, title: string) => {
    const tabId = `panel-${panelView}`;
    openTab({
      id: tabId,
      type: 'panel',
      title,
      pageId: '',
      panelView,
    });
  }, [openTab]);

  const openIntegrationTab = useCallback((id: string, title: string, url: string) => {
    openTab({
      id: `integration-${id}`,
      type: 'integration',
      title,
      pageId: '',
      integrationUrl: url,
    });
  }, [openTab]);

  const handleCreateItem = async () => {
    if (!token || !newItemTitle.trim()) return;
    setIsCreatingItem(true);
    try {
      const page = await pagesApi.create(token, {
        workspaceId,
        title: newItemTitle,
        parentId: createParentId || undefined,
      });
      if (showCreateModal === 'folder') {
        await pagesApi.update(token, page.id, { icon: null });
      }
      // New pages keep default icon (null) so UI shows FileText
      toast({ title: showCreateModal === 'folder' ? 'Folder created!' : 'Page created!' });
      setShowCreateModal(null);
      setNewItemTitle('');
      setCreateParentId(null);
      await loadWorkspace();
      if (showCreateModal === 'page') {
        loadPageContent(page.id);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create item',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingItem(false);
    }
  };

  const showConfirmDialog = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const handleDeletePage = async (pageId: string) => {
    if (!token) return;
    showConfirmDialog('Delete Item', 'Are you sure you want to delete this item?', async () => {
      try {
        await pagesApi.delete(token, pageId);
        toast({ title: 'Deleted' });
        // Close related tabs
        setOpenTabs((prev) => prev.filter((t) => t.pageId !== pageId));
        if (activeTabId?.includes(pageId)) {
          setActiveTabId(null);
        }
        loadWorkspace();
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSavePage = async (pageId: string) => {
    if (!token) return;
    const content = pageContents[pageId];
    if (!content) return;
    setIsSaving(true);
    try {
      await pagesApi.update(token, pageId, { title: content.title });
      await docApi.update(token, pageId, {
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content.content }] }] },
        plainText: content.content,
      });
      // Update tab title
      setOpenTabs((prev) => prev.map((t) => t.pageId === pageId && t.type === 'page' ? { ...t, title: content.title } : t));
      toast({ title: 'Saved!' });
      loadWorkspace();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Error', description: 'Only PDF, DOCX, and PPTX files are supported', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      let targetPageId = uploadTargetPageId;

      // If no target page, create a page for this file
      if (!targetPageId) {
        const pageName = file.name.replace(/\.[^.]+$/, '');
        const page = await pagesApi.create(token, {
          workspaceId,
          title: pageName,
        });
        targetPageId = page.id;
      }

      const source = await sourcesApi.upload(token, targetPageId, file);
      toast({ title: 'File uploaded!' });
      await loadWorkspace();

      // Load page and open source
      await loadPageContent(targetPageId);
      openSourceTab(source as SourceData, targetPageId);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadTargetPageId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = (targetPageId?: string) => {
    setUploadTargetPageId(targetPageId || null);
    fileInputRef.current?.click();
  };

  // Members actions
  const handleInviteMember = async () => {
    if (!token || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await workspacesApi.addMember(token, workspaceId, { email: inviteEmail, role: inviteRole });
      toast({ title: 'Member invited!' });
      setInviteEmail('');
      loadWorkspace();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite member',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token) return;
    showConfirmDialog('Remove Member', 'Remove this member?', async () => {
      try {
        await workspacesApi.removeMember(token, workspaceId, memberId);
        toast({ title: 'Member removed' });
        loadWorkspace();
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to remove member',
          variant: 'destructive',
        });
      }
    });
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!token) return;
    try {
      await workspacesApi.updateMemberRole(token, workspaceId, memberId, newRole);
      toast({ title: 'Role updated' });
      loadWorkspace();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateShareLink = async () => {
    if (!token) return;
    setIsGeneratingLink(true);
    try {
      const result = await workspacesApi.generateShareLink(token, workspaceId);
      const tokenOrLink = result.shareUrl || result.shareLink;
      const fullUrl = typeof window !== 'undefined' && tokenOrLink
        ? `${window.location.origin}/dashboard?join=${encodeURIComponent(tokenOrLink)}`
        : tokenOrLink;
      setShareLink(fullUrl);
      toast({ title: 'Share link generated!' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({ title: 'Link copied to clipboard!' });
  };

  const handleExport = async (pageId: string, format: 'PDF' | 'DOCX' | 'MARKDOWN') => {
    if (!token) return;
    try {
      const job = await exportApi.create(token, format, { pageIds: [pageId] });
      toast({ title: `Export started (${format})`, description: `Job ID: ${job.id}` });
      const pollExport = async (jobId: string, attempts = 0) => {
        if (attempts > 30) {
          toast({ title: 'Export timeout', description: 'Export is taking too long. Check back later.', variant: 'destructive' });
          return;
        }
        const result = await exportApi.get(token, jobId);
        if (result.status === 'COMPLETED' && result.resultUrl) {
          // Download file with auth token
          const response = await fetch(`/api/export/${jobId}/download`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ext = result.resultUrl.split('.').pop() || format.toLowerCase();
            link.download = `export.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          toast({ title: 'Export complete!', description: `Your ${format} file is downloading.` });
        } else if (result.status === 'FAILED') {
          toast({ title: 'Export failed', description: 'The export job failed. Please try again.', variant: 'destructive' });
        } else {
          setTimeout(() => pollExport(jobId, attempts + 1), 1000);
        }
      };
      setTimeout(() => pollExport(job.id), 1000);
    } catch (err) {
      toast({
        title: 'Export Error',
        description: err instanceof Error ? err.message : 'Failed to start export',
        variant: 'destructive',
      });
    }
  };

  // Settings actions
  const handleOpenSettings = () => {
    openPanelTab('settings', 'Settings');
    setProfileName(user?.name || '');
    setWsName(workspace?.name || '');
    setWsDescription(workspace?.description || '');
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setIsSavingProfile(true);
    try {
      const updated = await authApi.updateProfile(token, { name: profileName });
      updateUser({ name: updated.name });
      toast({ title: 'Profile updated!' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveWorkspaceSettings = async () => {
    if (!token) return;
    setIsSavingWorkspace(true);
    try {
      await workspacesApi.update(token, workspaceId, { name: wsName, description: wsDescription });
      toast({ title: 'Workspace updated!' });
      loadWorkspace();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update workspace',
        variant: 'destructive',
      });
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const currentUserRole = workspace?.members.find((m) => m.user.id === user?.id)?.role;
  const isOwner = currentUserRole === 'OWNER';

  // Build tree structure from flat pages
  const buildPageTree = (pages: PageData[]) => {
    const roots: PageData[] = [];
    const childMap: Record<string, PageData[]> = {};

    for (const page of pages) {
      if (page.parentId) {
        if (!childMap[page.parentId]) childMap[page.parentId] = [];
        childMap[page.parentId].push(page);
      } else {
        roots.push(page);
      }
    }

    return { roots, childMap };
  };

  const filteredPages = workspace?.pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const { roots, childMap } = buildPageTree(filteredPages);

  const isFolder = (page: PageData) => page.icon === FOLDER_ICON;

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <File className="h-3.5 w-3.5 text-red-500" />;
      case 'docx': case 'doc': return <FileText className="h-3.5 w-3.5 text-blue-500" />;
      case 'pptx': case 'ppt': return <FileImage className="h-3.5 w-3.5 text-orange-500" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getTabIcon = (tab: OpenTab) => {
    switch (tab.type) {
      case 'source': return getFileIcon(tab.title);
      case 'panel': return <Settings className="h-3.5 w-3.5" />;
      case 'integration': return <ExternalLink className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-3 w-3" />;
      case 'EDITOR': return <Pencil className="h-3 w-3" />;
      case 'VIEWER': return <Eye className="h-3 w-3" />;
      default: return null;
    }
  };

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  // Render sidebar tree item
  const renderTreeItem = (page: PageData, depth: number = 0) => {
    const children = childMap[page.id] || [];
    const folder = isFolder(page);
    const expanded = expandedFolders.has(page.id);
    const isActive = activeTab?.pageId === page.id && activeTab?.type === 'page';

    return (
      <div key={page.id}>
        <div className="group flex items-center" style={{ paddingLeft: `${depth * 16}px` }}>
          {folder ? (
            <button
              onClick={() => toggleFolder(page.id)}
              className="p-0.5 hover:bg-muted rounded mr-0.5"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <button
            onClick={() => folder ? toggleFolder(page.id) : loadPageContent(page.id)}
            className={`flex-1 flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-muted text-sm truncate text-left ${
              isActive ? 'bg-[#1f7a4a]/10 text-[#1f7a4a] font-medium' : ''
            }`}
          >
            <span>{folder ? (expanded ? <FolderOpen className="h-3.5 w-3.5 text-yellow-600" /> : <Folder className="h-3.5 w-3.5 text-yellow-600" />) : (page.icon ? <span className="text-base leading-none">{page.icon}</span> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />)}</span>
            <span className="truncate">{page.title}</span>
          </button>
          {folder && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={() => { setCreateParentId(page.id); setShowCreateModal('page'); }}
              title="Add page to folder"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={() => handleDeletePage(page.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {folder && expanded && children.map((child) => renderTreeItem(child, depth + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={handleFileUpload}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/30 flex flex-col shrink-0">
          <div className="p-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h2 className="text-lg font-semibold mt-3 truncate">{workspace.name}</h2>
            {workspace.description && (
              <p className="text-sm text-muted-foreground truncate">{workspace.description}</p>
            )}
          </div>

          <div className="p-3 flex-1 overflow-auto">
            {/* Add button */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workspace</span>
              <div className="relative">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowAddMenu(!showAddMenu)}>
                  <Plus className="h-4 w-4" />
                </Button>
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-20 py-1">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setShowAddMenu(false); setCreateParentId(null); setShowCreateModal('page'); }}
                    >
                      <FileText className="h-4 w-4" />
                      New Page
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setShowAddMenu(false); setCreateParentId(null); setShowCreateModal('folder'); }}
                    >
                      <FolderPlus className="h-4 w-4" />
                      New Folder
                    </button>
                    <div className="border-t my-1" />
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setShowAddMenu(false); triggerFileUpload(); }}
                    >
                      <Upload className="h-4 w-4" />
                      Upload File (PDF/DOCX/PPTX)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-7 h-7 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Page Tree */}
            <div className="space-y-0.5">
              {isUploading && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Uploading...
                </div>
              )}
              {roots.length > 0 ? (
                roots.map((page) => renderTreeItem(page))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {searchQuery ? 'No items found' : 'No pages yet. Click + to add.'}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t space-y-0.5">
            <Link href={`/workspace/${workspaceId}/tasks`}>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </Button>
            </Link>
            <Link href={`/workspace/${workspaceId}/calendar`}>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </Link>
            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab?.panelView === 'members' ? 'bg-[#1f7a4a]/10 text-[#1f7a4a]' : ''}`}
              size="sm"
              onClick={() => openPanelTab('members', `Members (${workspace.members.length})`)}
            >
              <Users className="h-4 w-4 mr-2" />
              Members ({workspace.members.length})
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab?.panelView === 'integrations' ? 'bg-[#1f7a4a]/10 text-[#1f7a4a]' : ''}`}
              size="sm"
              onClick={() => openPanelTab('integrations', 'Integrations')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Integrations
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start ${activeTab?.panelView === 'settings' ? 'bg-[#1f7a4a]/10 text-[#1f7a4a]' : ''}`}
              size="sm"
              onClick={handleOpenSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="border-b bg-muted/30 flex items-center overflow-x-auto shrink-0 h-10 px-1 gap-0.5">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm cursor-pointer shrink-0 max-w-[200px] transition-colors ${
                    activeTabId === tab.id
                      ? 'bg-background text-foreground font-medium shadow-sm border border-b-0 border-border -mb-px relative z-10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {getTabIcon(tab)}
                  <span className="truncate">{tab.title}</span>
                  <button
                    className="ml-auto hover:bg-muted rounded-sm p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            {/* No tabs open - show placeholder */}
            {!activeTab && (
              <div className="max-w-4xl mx-auto p-8">
                <div className="text-center py-20">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <h2 className="mt-4 text-xl font-semibold">Select or create a page</h2>
                  <p className="text-muted-foreground mt-2">
                    Choose a page from the sidebar, or use the + button to add pages, folders, or upload files
                  </p>
                  <div className="flex gap-3 justify-center mt-6">
                    <Button onClick={() => { setCreateParentId(null); setShowCreateModal('page'); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Page
                    </Button>
                    <Button variant="outline" onClick={() => triggerFileUpload()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Page Editor Tab */}
            {activeTab?.type === 'page' && (() => {
              const pageId = activeTab.pageId;
              const content = pageContents[pageId];
              if (!content) return (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              );
              return (
                <div className="flex flex-col h-full">
                  <header className="border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between h-12 px-6">
                      <Input
                        value={content.title}
                        onChange={(e) => setPageContents((prev) => ({
                          ...prev,
                          [pageId]: { ...prev[pageId], title: e.target.value },
                        }))}
                        className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 max-w-lg"
                        placeholder="Untitled"
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => triggerFileUpload(pageId)}>
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Attach File
                        </Button>
                        <div className="relative group/export">
                          <Button size="sm" variant="outline" onClick={() => setShowExportMenu(prev => prev === pageId ? null : pageId)}>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Export
                          </Button>
                          {showExportMenu === pageId && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-20 py-1">
                              {(['PDF', 'DOCX', 'MARKDOWN'] as const).map((format) => (
                                <button
                                  key={format}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  onClick={() => { handleExport(pageId, format); setShowExportMenu(null); }}
                                >
                                  Export as {format}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleSavePage(pageId)} disabled={isSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </header>
                  {/* Document Toolbar */}
                  <div className="border-b bg-card px-4 py-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-1">Format:</span>
                    <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Bold" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const e = ta.selectionEnd; const text = content.content; const selected = text.substring(s, e); setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '**' + selected + '**' + text.substring(e) }})); }
                      }}>
                        <span className="font-bold text-xs">B</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Italic" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const e = ta.selectionEnd; const text = content.content; const selected = text.substring(s, e); setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '*' + selected + '*' + text.substring(e) }})); }
                      }}>
                        <span className="italic text-xs">I</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Underline" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const e = ta.selectionEnd; const text = content.content; const selected = text.substring(s, e); setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '__' + selected + '__' + text.substring(e) }})); }
                      }}>
                        <span className="underline text-xs">U</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Heading 1" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '# ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs font-bold">H1</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Heading 2" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '## ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs font-bold">H2</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Heading 3" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '### ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs font-bold">H3</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Bullet List" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '- ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs">•</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Numbered List" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '1. ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs">1.</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Quote" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; const lineStart = text.lastIndexOf('\n', s - 1) + 1; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, lineStart) + '> ' + text.substring(lineStart) }})); }
                      }}>
                        <span className="text-xs">&ldquo;</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Code Block" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const e = ta.selectionEnd; const text = content.content; const selected = text.substring(s, e); setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '`' + selected + '`' + text.substring(e) }})); }
                      }}>
                        <span className="text-xs font-mono">&lt;/&gt;</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Horizontal Rule" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const text = content.content; setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '\n---\n' + text.substring(s) }})); }
                      }}>
                        <span className="text-xs">—</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Link" onClick={() => {
                        const ta = document.querySelector(`textarea[data-page-id="${pageId}"]`) as HTMLTextAreaElement;
                        if (ta) { const s = ta.selectionStart; const e = ta.selectionEnd; const text = content.content; const selected = text.substring(s, e); setPageContents(prev => ({ ...prev, [pageId]: { ...prev[pageId], content: text.substring(0, s) + '[' + (selected || 'text') + '](url)' + text.substring(e) }})); }
                      }}>
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Attached files */}
                  {content.sources.length > 0 && (
                    <div className="px-6 py-2 border-b bg-muted/20 flex items-center gap-2 overflow-x-auto">
                      <span className="text-xs text-muted-foreground shrink-0">Attached:</span>
                      {content.sources.map((source) => (
                        <button
                          key={source.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border text-xs hover:bg-muted shrink-0"
                          onClick={() => openSourceTab(source, pageId)}
                        >
                          {getFileIcon(source.fileName)}
                          <span className="truncate max-w-[120px]">{source.fileName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto p-8">
                      <textarea
                        data-page-id={pageId}
                        className="w-full min-h-[500px] p-4 text-lg leading-relaxed resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f7a4a]"
                        placeholder="Start writing your notes here..."
                        value={content.content}
                        onChange={(e) => setPageContents((prev) => ({
                          ...prev,
                          [pageId]: { ...prev[pageId], content: e.target.value },
                        }))}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Source Viewer Tab */}
            {activeTab?.type === 'source' && (() => {
              const pageId = activeTab.pageId;
              const content = pageContents[pageId];
              const source = content?.sources.find((s) => s.id === activeTab.sourceId);
              if (!source) return (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  File not found. Please reopen from the page.
                </div>
              );
              const ext = source.fileName.split('.').pop()?.toLowerCase();
              if (ext === 'pdf') {
                return (
                  <PDFViewer
                    sourceId={source.id}
                    fileName={source.fileName}
                    fileUrl={source.fileUrl}
                    pageCount={source.pageCount}
                    annotations={[]}
                    onCreateAnnotation={async () => {}}
                    onDeleteAnnotation={async () => {}}
                  />
                );
              }
              return (
                <DocumentViewer
                  sourceId={source.id}
                  fileName={source.fileName}
                  fileUrl={source.fileUrl}
                />
              );
            })()}

            {/* Members Panel Tab */}
            {activeTab?.type === 'panel' && activeTab.panelView === 'members' && (
              <div className="max-w-3xl mx-auto p-8 space-y-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#1f7a4a]" />
                  Members
                </h2>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite by Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleInviteMember()}
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail.trim()}>
                        {isInviting ? 'Inviting...' : 'Invite'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Invite by Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shareLink ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Share this link. When opened while logged in, the user will join this workspace.</p>
                        <div className="flex gap-2">
                          <Input value={shareLink} readOnly className="flex-1 text-sm font-mono" />
                          <Button variant="outline" onClick={handleCopyShareLink}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <a href={shareLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {shareLink}
                        </a>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={handleGenerateShareLink} disabled={isGeneratingLink}>
                        {isGeneratingLink ? 'Generating...' : 'Generate Invite Link'}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Current Members ({workspace.members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workspace.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#1f7a4a]/10 flex items-center justify-center text-[#1f7a4a] font-medium text-sm">
                              {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {member.user.name || member.user.email}
                                {member.user.id === user?.id && (
                                  <span className="text-xs text-muted-foreground ml-1">(you)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner && member.user.id !== user?.id ? (
                              <>
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                >
                                  <option value="OWNER">Owner</option>
                                  <option value="EDITOR">Editor</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {roleIcon(member.role)}
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Integrations Panel Tab */}
            {activeTab?.type === 'panel' && activeTab.panelView === 'integrations' && (
              <div className="max-w-3xl mx-auto p-8 space-y-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <ExternalLink className="h-6 w-6 text-[#1f7a4a]" />
                  Integrations
                </h2>
                <p className="text-muted-foreground">
                  Connect with external services to enhance your workflow.
                </p>

                {/* Zoom */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Zoom</CardTitle>
                        <CardDescription>Video calls, messaging, and file sharing</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('zoom-call', 'Zoom — Call', 'https://zoom.us/start/videomeeting')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Start Call
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('zoom-chat', 'Zoom — Chat', 'https://zoom.us/signin#/chat')}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('zoom-files', 'Zoom — Files', 'https://zoom.us/profile')}>
                        <Download className="h-4 w-4 mr-2" />
                        Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Microsoft Teams */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Microsoft Teams</CardTitle>
                        <CardDescription>Calls, chat, and collaboration</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('teams-call', 'Teams — Call', 'https://teams.microsoft.com/v2/')}>
                        <Phone className="h-4 w-4 mr-2" />
                        Start Call
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('teams-chat', 'Teams — Chat', 'https://teams.microsoft.com/v2/')}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('teams-files', 'Teams — Files', 'https://teams.microsoft.com/v2/')}>
                        <Download className="h-4 w-4 mr-2" />
                        Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Microsoft Outlook */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Microsoft Outlook</CardTitle>
                        <CardDescription>Email, calendar, and file attachments</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('outlook-mail', 'Outlook — Mail', 'https://outlook.live.com/mail/')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Open Mail
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('outlook-calendar', 'Outlook — Calendar', 'https://outlook.live.com/calendar/')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendar
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={() => openIntegrationTab('onedrive', 'OneDrive', 'https://onedrive.live.com/')}>
                        <Download className="h-4 w-4 mr-2" />
                        OneDrive Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Panel Tab */}
            {activeTab?.type === 'panel' && activeTab.panelView === 'settings' && (
              <div className="max-w-3xl mx-auto p-8 space-y-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Settings className="h-6 w-6 text-[#1f7a4a]" />
                  Settings
                </h2>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profile</CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-[#1f7a4a]/10 flex items-center justify-center text-[#1f7a4a] text-2xl font-semibold">
                        {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user?.name || 'No name set'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Name</label>
                      <div className="flex gap-2">
                        <Input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Your name"
                          className="flex-1"
                        />
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSavingProfile ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Workspace</CardTitle>
                    <CardDescription>
                      {isOwner ? 'Manage your workspace settings' : 'Workspace information'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Workspace Name</label>
                      <Input
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        disabled={!isOwner}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={wsDescription}
                        onChange={(e) => setWsDescription(e.target.value)}
                        placeholder="Workspace description"
                        disabled={!isOwner}
                      />
                    </div>
                    {isOwner && (
                      <Button onClick={handleSaveWorkspaceSettings} disabled={isSavingWorkspace}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSavingWorkspace ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <Button variant="destructive" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Integration Tab */}
            {activeTab?.type === 'integration' && activeTab.integrationUrl && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/20">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activeTab.title}</span>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                    <a href={activeTab.integrationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </Button>
                </div>
                <div className="flex-1">
                  <iframe
                    src={activeTab.integrationUrl}
                    className="w-full h-full border-0"
                    title={activeTab.title}
                    sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create Page/Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{showCreateModal === 'folder' ? 'Create Folder' : 'Create Page'}</CardTitle>
              <CardDescription>
                {showCreateModal === 'folder'
                  ? 'Create a folder to organize your documents'
                  : createParentId
                    ? 'Add a new page inside the selected folder'
                    : 'Add a new page to your workspace'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {showCreateModal === 'folder' ? 'Folder Name' : 'Title'}
                </label>
                <Input
                  placeholder={showCreateModal === 'folder' ? 'e.g., Semester 1' : 'e.g., Lecture Notes Week 1'}
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
                />
              </div>
              {showCreateModal === 'page' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'document', label: 'Document', Icon: FileText },
                      { value: 'presentation', label: 'Presentation', Icon: FileImage },
                      { value: 'spreadsheet', label: 'Spreadsheet', Icon: File },
                    ].map((type) => (
                      <button
                        key={type.value}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                          newItemType === type.value
                            ? 'border-[#1f7a4a] bg-[#1f7a4a]/5 text-[#1f7a4a]'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setNewItemType(type.value as typeof newItemType)}
                      >
                        <type.Icon className="h-5 w-5" />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowCreateModal(null); setNewItemTitle(''); setCreateParentId(null); setNewItemType('document'); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { handleCreateItem(); setNewItemType('document'); }}
                  disabled={!newItemTitle.trim() || isCreatingItem}
                >
                  {isCreatingItem ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{confirmDialog.title}</CardTitle>
              <CardDescription>{confirmDialog.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
