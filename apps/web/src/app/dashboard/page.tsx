'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FolderOpen, MoreHorizontal, Pencil, Trash2, GraduationCap, BookOpen, Link2, CheckSquare, Calendar, Video, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createWorkspaceSchema, updateWorkspaceSchema } from '@nota/shared';
import { useAuthStore } from '@/lib/store';
import { workspacesApi, lmsApi, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { NOTA_OPEN_CREATE_WORKSPACE } from '@/components/app/CommandPalette';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  _count: { pages: number };
}

interface LmsIntegration {
  id: string;
  provider: string;
  baseUrl: string;
  createdAt: string;
  _count: { courses: number };
}

interface LmsCourse {
  id: string;
  externalId: string;
  name: string;
  code: string | null;
  term: string | null;
  syncedAt: string;
}

function DashboardContent() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  // LMS / University
  const [lmsIntegrations, setLmsIntegrations] = useState<LmsIntegration[]>([]);
  const [showLmsModal, setShowLmsModal] = useState(false);
  const [lmsProvider, setLmsProvider] = useState<string>('CANVAS');
  const [lmsBaseUrl, setLmsBaseUrl] = useState('');
  const [lmsToken, setLmsToken] = useState('');
  const [isAddingLms, setIsAddingLms] = useState(false);
  const [coursesForIntegration, setCoursesForIntegration] = useState<{ id: string; courses: LmsCourse[] } | null>(null);
  const [loadingCoursesId, setLoadingCoursesId] = useState<string | null>(null);
  const [showLinkWorkspaceModal, setShowLinkWorkspaceModal] = useState<{ integrationId: string } | null>(null);
  const [linkingWorkspaceId, setLinkingWorkspaceId] = useState<string | null>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const searchParams = useSearchParams();
  const joinAttempted = useRef(false);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const onOpenCreate = () => setShowCreateModal(true);
    globalThis.addEventListener(NOTA_OPEN_CREATE_WORKSPACE, onOpenCreate);
    return () => globalThis.removeEventListener(NOTA_OPEN_CREATE_WORKSPACE, onOpenCreate);
  }, []);

  useEffect(() => {
    if (showDeleteConfirm && deleteModalRef.current) {
      deleteModalRef.current.focus();
    }
  }, [showDeleteConfirm]);

  const loadLmsIntegrations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await lmsApi.listIntegrations(token);
      setLmsIntegrations(data);
    } catch {
      // Non-blocking; LMS is optional
    }
  }, [token]);

  const loadWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await workspacesApi.list(token);
      setWorkspaces(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workspaces',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (!authChecked) return;
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    loadWorkspaces();
    loadLmsIntegrations();
  }, [authChecked, isAuthenticated, router, loadWorkspaces, loadLmsIntegrations]);

  useEffect(() => {
    const joinToken = searchParams.get('join');
    if (!joinToken || !token || joinAttempted.current) return;
    joinAttempted.current = true;
    workspacesApi.joinByShareLink(token, joinToken)
      .then((w) => {
        toast({ title: 'Joined workspace!', description: w.name });
        router.replace(`/workspace/${w.id}`);
      })
      .catch(() => {
        toast({ title: 'Invalid or expired invite link', variant: 'destructive' });
        router.replace('/dashboard');
      });
  }, [searchParams, token, router, toast]);

  const handleCreateWorkspace = async () => {
    const parsed = createWorkspaceSchema.safeParse({
      name: newWorkspaceName.trim(),
      description: newWorkspaceDesc.trim() || undefined,
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
      toast({ title: 'Validation error', description: msg, variant: 'destructive' });
      return;
    }
    if (!token) return;
    setIsCreating(true);
    try {
      await workspacesApi.create(token, parsed.data);
      toast({ title: 'Workspace created!' });
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      loadWorkspaces();
    } catch (error) {
      let message = 'Failed to create workspace. Check that the API is running and you are logged in.';
      if (error instanceof ApiError) message = error.message;
      else if (error instanceof Error) message = error.message;
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateDemo = async () => {
    if (!token) return;
    setIsCreatingDemo(true);
    try {
      const workspace = await workspacesApi.createDemo(token);
      toast({ title: 'Demo workspace created!' });
      loadWorkspaces();
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create demo workspace.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleEditWorkspace = async () => {
    const parsed = updateWorkspaceSchema.safeParse({
      name: editName.trim(),
      description: editDesc.trim() || undefined,
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
      toast({ title: 'Validation error', description: msg, variant: 'destructive' });
      return;
    }
    if (!token || !editingWorkspace) return;
    setIsEditing(true);
    try {
      await workspacesApi.update(token, editingWorkspace.id, {
        name: parsed.data.name ?? editName,
        description: parsed.data.description ?? (editDesc || undefined),
      });
      toast({ title: 'Workspace updated!' });
      setShowEditModal(false);
      setEditingWorkspace(null);
      loadWorkspaces();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workspace',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await workspacesApi.delete(token, id);
      toast({ title: 'Workspace deleted' });
      setShowDeleteConfirm(null);
      loadWorkspaces();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workspace',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setEditName(workspace.name);
    setEditDesc(workspace.description || '');
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleAddLms = async () => {
    if (!token || !lmsBaseUrl.trim() || !lmsToken.trim()) return;
    setIsAddingLms(true);
    try {
      await lmsApi.createIntegration(token, {
        provider: lmsProvider,
        baseUrl: lmsBaseUrl.trim(),
        accessToken: lmsToken,
      });
      toast({ title: 'University connection added' });
      setShowLmsModal(false);
      setLmsBaseUrl('');
      setLmsToken('');
      loadLmsIntegrations();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to add connection',
        variant: 'destructive',
      });
    } finally {
      setIsAddingLms(false);
    }
  };

  const handleViewCourses = async (integrationId: string) => {
    if (!token) return;
    setLoadingCoursesId(integrationId);
    try {
      const courses = await lmsApi.getCourses(token, integrationId);
      setCoursesForIntegration({ id: integrationId, courses });
    } catch {
      toast({ title: 'Failed to load courses', variant: 'destructive' });
    } finally {
      setLoadingCoursesId(null);
    }
  };

  const handleLinkWorkspace = async (workspaceId: string, integrationId: string) => {
    if (!token) return;
    setLinkingWorkspaceId(workspaceId);
    try {
      await lmsApi.linkWorkspace(token, workspaceId, integrationId);
      toast({ title: 'Workspace linked to university' });
      setShowLinkWorkspaceModal(null);
    } catch {
      toast({ title: 'Failed to link workspace', variant: 'destructive' });
    } finally {
      setLinkingWorkspaceId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  const firstWorkspaceId = workspaces[0]?.id;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* University / Courses section — first */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                University / Courses
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Connect your LMS or view courses. Link Canvas, Moodle, or Blackboard.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/courses">
                <Button variant="outline" className="h-10 px-5 rounded-md font-medium border-border">
                  View courses
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 px-5 rounded-md font-medium border-border"
                onClick={() => setShowLmsModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add LMS
              </Button>
            </div>
          </div>
          {lmsIntegrations.length === 0 ? (
          <Card className="rounded-lg border border-dashed border-border bg-card">
            <CardContent className="py-8 px-6 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No university connection yet.</p>
              <Button variant="link" className="mt-2 text-primary" onClick={() => setShowLmsModal(true)}>
                Connect your university
              </Button>
            </CardContent>
          </Card>
          ) : (
            <div className="space-y-3">
              {lmsIntegrations.map((int) => (
                <Card key={int.id} className="rounded-lg border border-border bg-card">
                  <CardContent className="py-4 px-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{int.provider}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[240px]">{int.baseUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-md"
                        onClick={() => handleViewCourses(int.id)}
                        disabled={loadingCoursesId === int.id}
                      >
                        {loadingCoursesId === int.id ? 'Loading…' : 'View courses'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md"
                        onClick={() => setShowLinkWorkspaceModal({ integrationId: int.id })}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Link to workspace
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Apps: Tasks & Calendar (when user has at least one workspace) */}
        {firstWorkspaceId && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-3">Apps</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/workspace/${firstWorkspaceId}/tasks`}>
                <Button variant="outline" className="h-auto py-3 px-4 gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Button>
              </Link>
              <Link href={`/workspace/${firstWorkspaceId}/calendar`}>
                <Button variant="outline" className="h-auto py-3 px-4 gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
              </Link>
              <a href="https://zoom.us/schedule" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-auto py-3 px-4 gap-2">
                  <Video className="h-4 w-4" />
                  Zoom
                </Button>
              </a>
              <a href="https://outlook.office.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-auto py-3 px-4 gap-2">
                  <Mail className="h-4 w-4" />
                  Outlook
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Calendar events can include a meeting link (Zoom, Meet, Outlook). Use Zoom/Outlook for calls and mail.</p>
          </section>
        )}

        {/* My Workspaces section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                My Workspaces
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Organize pages, docs, and PDFs in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleCreateDemo}
                disabled={isCreatingDemo}
                className="h-10 px-5 rounded-md font-medium"
              >
                {isCreatingDemo ? 'Creating...' : 'Demo for pitch'}
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto h-10 px-5 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New workspace
              </Button>
            </div>
          </div>

          {workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 px-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-xl bg-muted flex items-center justify-center mb-6">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No workspaces yet</h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
              Create your first workspace to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Button
                variant="outline"
                className="h-10 px-5 rounded-md font-medium"
                onClick={handleCreateDemo}
                disabled={isCreatingDemo}
              >
                {isCreatingDemo ? 'Creating...' : 'Load demo for pitch'}
              </Button>
              <Button
                className="h-10 px-5 rounded-md font-medium"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create workspace
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="relative group">
                <Link href={`/workspace/${workspace.id}`} className="block">
                  <Card className="h-full rounded-lg border border-border bg-card transition-all hover:shadow-md hover:border-primary/30 overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription className="mt-0.5 text-sm">
                            {workspace._count.pages} {workspace._count.pages === 1 ? 'page' : 'pages'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {workspace.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {workspace.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="relative">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-card border border-border shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === workspace.id ? null : workspace.id);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {activeMenu === workspace.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-border bg-card shadow-lg py-1">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditModal(workspace);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 text-left"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteConfirm(workspace.id);
                            setActiveMenu(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </section>
      </main>

      {/* Add LMS Modal */}
      {showLmsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLmsModal(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowLmsModal(false); }}
          aria-label="Close modal"
        >
          <Card className="w-full max-w-md rounded-lg border border-border shadow-lg bg-card" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Connect your university
              </CardTitle>
              <CardDescription>Add an LMS (Blackboard, Canvas, or Moodle). For demo, token is stored as-is; OAuth can be added later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lms-provider" className="text-sm font-medium">Provider</Label>
                <select
                  id="lms-provider"
                  value={lmsProvider}
                  onChange={(e) => setLmsProvider(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="BLACKBOARD">Blackboard</option>
                  <option value="CANVAS">Canvas</option>
                  <option value="MOODLE">Moodle</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lms-baseurl" className="text-sm font-medium">Base URL</Label>
                <Input
                  id="lms-baseurl"
                  placeholder="https://canvas.university.edu"
                  value={lmsBaseUrl}
                  onChange={(e) => setLmsBaseUrl(e.target.value)}
                  className="rounded-md h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lms-token" className="text-sm font-medium">Access token</Label>
                <Input
                  id="lms-token"
                  type="password"
                  placeholder="Paste your API token (placeholder for OAuth)"
                  value={lmsToken}
                  onChange={(e) => setLmsToken(e.target.value)}
                  className="rounded-md h-10"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-md h-10" onClick={() => setShowLmsModal(false)}>Cancel</Button>
                <Button className="flex-1 rounded-md h-10" onClick={handleAddLms} disabled={!lmsBaseUrl.trim() || !lmsToken.trim() || isAddingLms}>
                  {isAddingLms ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courses list modal */}
      {coursesForIntegration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCoursesForIntegration(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setCoursesForIntegration(null); }}
          aria-label="Close modal"
        >
          <Card className="w-full max-w-lg max-h-[80vh] rounded-lg border border-border shadow-lg bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg font-semibold">Courses</CardTitle>
              <CardDescription>Courses from this integration (demo may show mock data)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <ul className="space-y-2">
                {coursesForIntegration.courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/50">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{c.name}</p>
                      {(c.code || c.term) && (
                        <p className="text-xs text-muted-foreground">{[c.code, c.term].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {coursesForIntegration.courses.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No courses found.</p>
              )}
              <Button variant="outline" className="w-full mt-4 rounded-md h-10" onClick={() => setCoursesForIntegration(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link to workspace modal */}
      {showLinkWorkspaceModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLinkWorkspaceModal(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowLinkWorkspaceModal(null); }}
          aria-label="Close modal"
        >
          <Card className="w-full max-w-sm rounded-lg border border-border shadow-lg bg-card" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Link to workspace</CardTitle>
              <CardDescription>Choose a workspace to link to this university connection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {workspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Create a workspace first.</p>
              ) : (
                workspaces.map((w) => (
                  <Button
                    key={w.id}
                    variant="outline"
                    className="w-full justify-start rounded-md h-10"
                    onClick={() => handleLinkWorkspace(w.id, showLinkWorkspaceModal.integrationId)}
                    disabled={linkingWorkspaceId === w.id}
                  >
                    {linkingWorkspaceId === w.id ? 'Linking…' : w.name}
                  </Button>
                ))
              )}
              <Button variant="ghost" className="w-full rounded-md h-10 mt-2" onClick={() => setShowLinkWorkspaceModal(null)}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateModal(false); }}
          aria-label="Close modal"
        >
          <Card className="w-full max-w-md rounded-lg border border-border shadow-lg bg-card" onClick={e => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateModal(false); }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Create workspace</CardTitle>
              <CardDescription>Add a new workspace for your project or course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-ws-name" className="text-sm font-medium">Name</Label>
                <Input
                  id="create-ws-name"
                  placeholder="e.g. Machine Learning Course"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newWorkspaceName.trim() && !isCreating) handleCreateWorkspace(); } }}
                  autoFocus
                  className="rounded-md h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-ws-desc" className="text-sm font-medium">Description (optional)</Label>
                <Input
                  id="create-ws-desc"
                  placeholder="Brief description..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newWorkspaceName.trim() && !isCreating) handleCreateWorkspace(); } }}
                  className="rounded-md h-10"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-md h-10" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-md h-10 bg-primary hover:bg-primary/90" onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim() || isCreating}>
                  {isCreating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditModal && editingWorkspace && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowEditModal(false); setEditingWorkspace(null); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowEditModal(false); setEditingWorkspace(null); } }}
          aria-label="Close modal"
        >
          <Card className="w-full max-w-md rounded-lg border border-border shadow-lg bg-card" onClick={e => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') { setShowEditModal(false); setEditingWorkspace(null); } }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Edit workspace</CardTitle>
              <CardDescription>Update name and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ws-name" className="text-sm font-medium">Name</Label>
                <Input
                  id="edit-ws-name"
                  placeholder="Workspace name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (editName.trim() && !isEditing) handleEditWorkspace(); } }}
                  autoFocus
                  className="rounded-md h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ws-desc" className="text-sm font-medium">Description (optional)</Label>
                <Input
                  id="edit-ws-desc"
                  placeholder="Brief description..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (editName.trim() && !isEditing) handleEditWorkspace(); } }}
                  className="rounded-md h-10"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-md h-10" onClick={() => { setShowEditModal(false); setEditingWorkspace(null); }}>Cancel</Button>
                <Button className="flex-1 rounded-md h-10 bg-primary hover:bg-primary/90" onClick={handleEditWorkspace} disabled={!editName.trim() || isEditing}>{isEditing ? 'Saving…' : 'Save'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          ref={deleteModalRef}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 outline-none"
          onClick={() => setShowDeleteConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-workspace-title"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!isDeleting) handleDeleteWorkspace(showDeleteConfirm);
            } else if (e.key === 'Escape' || e.key === ' ') {
              e.preventDefault();
              setShowDeleteConfirm(null);
            }
          }}
        >
          <Card
            className="w-full max-w-sm rounded-lg border border-border shadow-lg bg-card"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3">
              <CardTitle id="delete-workspace-title" className="text-lg font-semibold">Delete workspace</CardTitle>
              <CardDescription>This will permanently delete this workspace and all its pages. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-md h-10" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" className="flex-1 rounded-md h-10" onClick={() => handleDeleteWorkspace(showDeleteConfirm)} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
