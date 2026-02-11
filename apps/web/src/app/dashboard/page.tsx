'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, LogOut, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">N</span>
              </div>
              <span className="text-xl font-bold">Nota</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="w-64 pl-9"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Workspaces</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your academic workspaces
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">No workspaces yet</h2>
            <p className="text-muted-foreground mt-2">
              Create your first workspace to get started
            </p>
            <Button className="mt-6" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/workspace/${workspace.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workspace.name}</CardTitle>
                        <CardDescription>
                          {workspace._count.pages} {workspace._count.pages === 1 ? 'page' : 'pages'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {workspace.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {workspace.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Workspace</CardTitle>
              <CardDescription>Add a new workspace for your project or course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Machine Learning Course"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="Brief description..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
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
    </div>
  );
}
