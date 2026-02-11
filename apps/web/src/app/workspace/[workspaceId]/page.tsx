'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAppStore } from '@/lib/store';
import { workspacesApi, pagesApi, docApi, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ActiveView = 'none' | 'page' | 'members' | 'settings';

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
  const { token, user, isAuthenticated, updateUser, clearAuth } = useAuthStore();
  const { setCurrentWorkspace } = useAppStore();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // View state
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Inline page editor state
  const [pageTitle, setPageTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

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

  const loadPageContent = useCallback(async (pageId: string) => {
    if (!token) return;
    setIsLoadingPage(true);
    try {
      const pageData = await pagesApi.get(token, pageId);
      setPageTitle(pageData.title);
      setDocContent(pageData.doc?.plainText || '');
      setSelectedPageId(pageId);
      setActiveView('page');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load page',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPage(false);
    }
  }, [token, toast]);

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
      await loadWorkspace();
      loadPageContent(page.id);
    } catch {
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
      if (selectedPageId === pageId) {
        setActiveView('none');
        setSelectedPageId(null);
      }
      loadWorkspace();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      });
    }
  };

  const handleSavePage = async () => {
    if (!token || !selectedPageId) return;
    setIsSaving(true);
    try {
      await pagesApi.update(token, selectedPageId, { title: pageTitle });
      await docApi.update(token, selectedPageId, {
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: docContent }] }] },
        plainText: docContent,
      });
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
    if (!confirm('Remove this member?')) return;
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
      setShareLink(result.shareUrl || result.shareLink);
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

  // Settings actions
  const handleOpenSettings = () => {
    setActiveView('settings');
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

  const currentUserRole = workspace?.members.find((m) => m.user.id === user?.id)?.role;
  const isOwner = currentUserRole === 'OWNER';

  const filteredPages = workspace?.pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-3 w-3" />;
      case 'EDITOR': return <Pencil className="h-3 w-3" />;
      case 'VIEWER': return <Eye className="h-3 w-3" />;
      default: return null;
    }
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
                  <button
                    onClick={() => loadPageContent(page.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm truncate text-left ${
                      activeView === 'page' && selectedPageId === page.id
                        ? 'bg-[#1f7a4a]/10 text-[#1f7a4a] font-medium'
                        : ''
                    }`}
                  >
                    <span>{page.icon || '📄'}</span>
                    <span className="truncate">{page.title}</span>
                  </button>
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
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeView === 'members' ? 'bg-[#1f7a4a]/10 text-[#1f7a4a]' : ''}`}
            size="sm"
            onClick={() => setActiveView('members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Members ({workspace.members.length})
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${activeView === 'settings' ? 'bg-[#1f7a4a]/10 text-[#1f7a4a]' : ''}`}
            size="sm"
            onClick={handleOpenSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* No selection placeholder */}
        {activeView === 'none' && (
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
        )}

        {/* Inline Page Editor */}
        {activeView === 'page' && (
          <div className="flex flex-col h-full">
            {isLoadingPage ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <header className="border-b sticky top-0 bg-background z-10">
                  <div className="flex items-center justify-between h-14 px-6">
                    <Input
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 max-w-lg"
                      placeholder="Untitled"
                    />
                    <Button size="sm" onClick={handleSavePage} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </header>
                <div className="flex-1">
                  <div className="max-w-4xl mx-auto p-8">
                    <textarea
                      className="w-full min-h-[500px] p-4 text-lg leading-relaxed resize-none border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f7a4a]"
                      placeholder="Start writing your notes here..."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Members Panel */}
        {activeView === 'members' && (
          <div className="max-w-3xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="h-6 w-6 text-[#1f7a4a]" />
                Members
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveView('none')}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Invite by Email */}
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

            {/* Invite by Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Invite by Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shareLink ? (
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="flex-1 text-sm" />
                    <Button variant="outline" onClick={handleCopyShareLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handleGenerateShareLink} disabled={isGeneratingLink}>
                    {isGeneratingLink ? 'Generating...' : 'Generate Invite Link'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Current Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Current Members ({workspace.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workspace.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
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

        {/* Settings Panel */}
        {activeView === 'settings' && (
          <div className="max-w-3xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="h-6 w-6 text-[#1f7a4a]" />
                Settings
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveView('none')}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Section */}
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

            {/* Workspace Section */}
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

            {/* Logout */}
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
