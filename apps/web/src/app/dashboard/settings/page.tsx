'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Settings, User, Video, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { authApi, integrationsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, updateUser, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [integrations, setIntegrations] = useState<{ zoom: boolean; outlook: boolean } | null>(null);
  const [connectingZoom, setConnectingZoom] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const oauthHandled = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    if (!token) return;
    authApi
      .me(token)
      .then((data) => {
        setName(data.name ?? '');
        setAvatarUrl(data.avatarUrl ?? '');
      })
      .catch(() => {
        toast({ title: 'Failed to load profile', variant: 'destructive' });
      })
      .finally(() => setIsLoading(false));
  }, [token, isAuthenticated, router, toast]);

  useEffect(() => {
    if (!token) return;
    integrationsApi.status(token).then(setIntegrations).catch(() => setIntegrations({ zoom: false, outlook: false }));
  }, [token]);

  useEffect(() => {
    if (oauthHandled.current) return;
    const success = searchParams.get('integrations');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error') || searchParams.get('message');
    if (success === 'success' && provider) {
      oauthHandled.current = true;
      toast({ title: `${provider === 'zoom' ? 'Zoom' : 'Outlook'} connected successfully` });
      if (token) integrationsApi.status(token).then(setIntegrations);
      router.replace('/dashboard/settings', { scroll: false });
    } else if (success === 'error' || error) {
      oauthHandled.current = true;
      toast({ title: 'Connection failed', description: error || 'Please try again.', variant: 'destructive' });
      router.replace('/dashboard/settings', { scroll: false });
    }
  }, [searchParams, token, toast, router]);

  const handleConnectZoom = async () => {
    if (!token) return;
    setConnectingZoom(true);
    try {
      const { redirectUrl } = await integrationsApi.getZoomAuthorizeUrl(token);
      globalThis.location.href = redirectUrl;
    } catch {
      toast({ title: 'Could not start Zoom connection', variant: 'destructive' });
      setConnectingZoom(false);
    }
  };

  const handleConnectOutlook = async () => {
    if (!token) return;
    setConnectingOutlook(true);
    try {
      const { redirectUrl } = await integrationsApi.getOutlookAuthorizeUrl(token);
      globalThis.location.href = redirectUrl;
    } catch {
      toast({ title: 'Could not start Outlook connection', variant: 'destructive' });
      setConnectingOutlook(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile(token, {
        name: name.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      updateUser({ name: updated.name ?? undefined, avatarUrl: updated.avatarUrl ?? undefined });
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>Manage your account and profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="max-w-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-avatar">Avatar URL</Label>
              <Input
                id="settings-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">Link to an image for your profile picture</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Integrations</CardTitle>
          <CardDescription>Connect Zoom and Outlook for calendar meetings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Zoom</span>
              {integrations?.zoom && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectZoom}
              disabled={connectingZoom || connectingOutlook}
            >
              {integrations?.zoom ? 'Reconnect Zoom' : 'Connect Zoom'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Outlook</span>
              {integrations?.outlook && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectOutlook}
              disabled={connectingZoom || connectingOutlook}
            >
              {integrations?.outlook ? 'Reconnect Outlook' : 'Connect Outlook'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
