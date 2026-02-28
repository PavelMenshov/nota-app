'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, LogOut, Settings, Search, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { workspacesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  _count: { pages: number };
}

export default function DashboardPage() {
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const router = useRouter();
  const { token, user, clearAuth, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadWorkspaces();
  }, [isAuthenticated, router]);

  const loadWorkspaces = async () => {
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
  };

  const handleCreateWorkspace = async () => {
    if (!token || !newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      await workspacesApi.create(token, {
        name: newWorkspaceName,
        description: newWorkspaceDesc || undefined,
      });
      toast({ title: 'Workspace created!' });
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      loadWorkspaces();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workspace',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const handleEditWorkspace = async () => {
    if (!token || !editingWorkspace || !editName.trim()) return;
    setIsEditing(true);
    try {
      await workspacesApi.update(token, editingWorkspace.id, {
        name: editName,
        description: editDesc || undefined,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition-opacity">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">Nota</span>
            </Link>
            <div className="hidden md:block w-px h-6 bg-border" />
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces..."
                  className="w-56 lg:w-72 pl-9 h-9 rounded-lg border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:bg-background"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline max-w-[180px] truncate">
              {user?.email}
            </span>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-lg z-20 p-3">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Workspaces
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              Create and manage your academic workspaces
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto h-10 rounded-lg font-medium shadow-sm bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 rounded-2xl border border-dashed border-border bg-muted/30">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No workspaces yet</h2>
            <p className="text-muted-foreground mt-2 text-center max-w-sm">
              Create your first workspace to organize pages, docs, and PDFs in one place.
            </p>
            <Button
              className="mt-6 rounded-lg font-medium"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="relative group">
                <Link href={`/workspace/${workspace.id}`}>
                  <Card className="h-full rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:bg-card cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {workspace._count.pages} {workspace._count.pages === 1 ? 'page' : 'pages'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {workspace.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {workspace.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-card/90 border border-border shadow-sm hover:bg-muted"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === workspace.id ? null : workspace.id);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {activeMenu === workspace.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-40 rounded-lg border border-border bg-card shadow-lg z-20 py-1 overflow-hidden">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-foreground"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-xl border border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Create Workspace</CardTitle>
              <CardDescription>Add a new workspace for your project or course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-ws-name" className="text-sm font-medium text-foreground">Name</Label>
                <Input
                  id="create-ws-name"
                  placeholder="e.g., Machine Learning Course"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  autoFocus
                  className="rounded-lg h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-ws-desc" className="text-sm font-medium text-foreground">Description (optional)</Label>
                <Input
                  id="create-ws-desc"
                  placeholder="Brief description..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-lg h-10"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-lg h-10"
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditModal && editingWorkspace && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-xl border border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Edit Workspace</CardTitle>
              <CardDescription>Update workspace name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ws-name" className="text-sm font-medium text-foreground">Name</Label>
                <Input
                  id="edit-ws-name"
                  placeholder="Workspace name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="rounded-lg h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ws-desc" className="text-sm font-medium text-foreground">Description (optional)</Label>
                <Input
                  id="edit-ws-desc"
                  placeholder="Brief description..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="rounded-lg h-10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-lg h-10"
                  onClick={() => { setShowEditModal(false); setEditingWorkspace(null); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-lg h-10"
                  onClick={handleEditWorkspace}
                  disabled={!editName.trim() || isEditing}
                >
                  {isEditing ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm rounded-xl border border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Delete Workspace</CardTitle>
              <CardDescription className="text-muted-foreground">
                Are you sure? This will permanently delete this workspace and all its pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-lg h-10"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-lg h-10"
                  onClick={() => handleDeleteWorkspace(showDeleteConfirm)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
