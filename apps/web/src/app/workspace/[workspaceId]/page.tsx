'use client';

import { useState, useEffect } from 'react';
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
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAppStore } from '@/lib/store';
import { workspacesApi, pagesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Page {
  id: string;
  title: string;
  icon: string | null;
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
  pages: Page[];
  members: Member[];
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { setCurrentWorkspace } = useAppStore();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadWorkspace();
  }, [workspaceId, isAuthenticated, router]);

  const loadWorkspace = async () => {
    if (!token) return;
    try {
      const data = await workspacesApi.get(token, workspaceId);
      setWorkspace(data);
      setCurrentWorkspace({ id: data.id, name: data.name, description: data.description });
    } catch (error) {
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

  const handleCreatePage = async () => {
    if (!token || !newPageTitle.trim()) return;
    setIsCreatingPage(true);
    try {
      const page = await pagesApi.create(token, {
        workspaceId,
        title: newPageTitle,
      });
      toast({ title: 'Page created!' });
      setShowCreatePage(false);
      setNewPageTitle('');
      router.push(`/workspace/${workspaceId}/page/${page.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    try {
      await pagesApi.delete(token, pageId);
      toast({ title: 'Page deleted' });
      loadWorkspace();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      });
    }
  };

  const filteredPages = workspace?.pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
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

        <div className="p-4 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Pages</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowCreatePage(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            {filteredPages && filteredPages.length > 0 ? (
              filteredPages.map((page) => (
                <div key={page.id} className="group flex items-center">
                  <Link
                    href={`/workspace/${workspaceId}/page/${page.id}`}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm truncate"
                  >
                    <span>{page.icon || '📄'}</span>
                    <span className="truncate">{page.title}</span>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No pages found' : 'No pages yet'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-1">
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
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Members ({workspace.members.length})
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">Select or create a page</h2>
            <p className="text-muted-foreground mt-2">
              Choose a page from the sidebar or create a new one
            </p>
            <Button className="mt-6" onClick={() => setShowCreatePage(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Button>
          </div>
        </div>
      </main>

      {/* Create Page Modal */}
      {showCreatePage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Page</CardTitle>
              <CardDescription>Add a new page to your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Lecture Notes Week 1"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreatePage(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePage}
                  disabled={!newPageTitle.trim() || isCreatingPage}
                >
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
