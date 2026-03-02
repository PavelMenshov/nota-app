'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Settings, User, Video, Mail, CheckCircle, BookOpen, Plus, Trash2, Monitor, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { authApi, integrationsApi, settingsApi, type QuickLinksPreferences, type CustomLink } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

/** Normalize old API shape (provider/customUrl) to new shape (preset + custom[]) */
function normalizeQuickLinks(data: QuickLinksPreferences): QuickLinksPreferences {
  const lib = data.library as { provider?: string; customUrl?: string; customLabel?: string; preset?: string; custom?: CustomLink[] } | undefined;
  const cls = data.classroom as { provider?: string; customUrl?: string; customLabel?: string; preset?: string; custom?: CustomLink[] } | undefined;
  const library = lib
    ? lib.preset !== undefined
      ? { preset: (lib.preset as 'google' | 'none') || 'google', custom: lib.custom ?? [] }
      : lib.provider === 'custom' && lib.customUrl
        ? { preset: 'none' as const, custom: [{ url: lib.customUrl, label: lib.customLabel || 'Library' }] }
        : { preset: (lib.provider === 'google' ? 'google' : 'none') as 'google' | 'none', custom: [] }
    : undefined;
  const classroom = cls
    ? cls.preset !== undefined
      ? { preset: (cls.preset as 'google' | 'teams' | 'none') || 'google', custom: cls.custom ?? [] }
      : cls.provider === 'custom' && cls.customUrl
        ? { preset: 'none' as const, custom: [{ url: cls.customUrl, label: cls.customLabel || 'Classroom' }] }
        : { preset: (cls.provider === 'teams' ? 'teams' : cls.provider === 'google' ? 'google' : 'none') as 'google' | 'teams' | 'none', custom: [] }
    : undefined;
  return { library, classroom };
}

export default function DashboardSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, isAuthenticated, clearAuth } = useAuthStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{ zoom: boolean; outlook: boolean } | null>(null);
  const [connectingZoom, setConnectingZoom] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const [quickLinks, setQuickLinks] = useState<QuickLinksPreferences>({});
  const [quickLinksSaving, setQuickLinksSaving] = useState(false);
  const oauthHandled = useRef(false);

  const [libraryPreset, setLibraryPreset] = useState<'google' | 'none'>('google');
  const [libraryCustom, setLibraryCustom] = useState<CustomLink[]>([]);
  const [classroomPreset, setClassroomPreset] = useState<'google' | 'teams' | 'none'>('google');
  const [classroomCustom, setClassroomCustom] = useState<CustomLink[]>([]);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    if (!token) return;
    setIsLoading(true);
    authApi.me(token).catch(() => {}).finally(() => setIsLoading(false));
  }, [token, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;
    integrationsApi.status(token).then(setIntegrations).catch(() => setIntegrations({ zoom: false, outlook: false }));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    settingsApi
      .getQuickLinks(token)
      .then((data) => {
        const norm = normalizeQuickLinks(data);
        setQuickLinks(norm);
        if (norm.library) {
          setLibraryPreset((norm.library.preset as 'google' | 'none') ?? 'google');
          setLibraryCustom(norm.library.custom ?? []);
        }
        if (norm.classroom) {
          setClassroomPreset((norm.classroom.preset as 'google' | 'teams' | 'none') ?? 'google');
          setClassroomCustom(norm.classroom.custom ?? []);
        }
      })
      .catch(() => {});
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

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeletingAccount(true);
    try {
      await authApi.deleteAccount(token);
      clearAuth();
      toast({ title: 'Your account has been permanently deleted.' });
      router.replace('/');
    } catch {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
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

  const handleSaveQuickLinks = async () => {
    if (!token) return;
    setQuickLinksSaving(true);
    try {
      const payload: QuickLinksPreferences = {
        library: { preset: libraryPreset, custom: libraryCustom.filter((c) => c.url.trim() && c.label.trim()) },
        classroom: { preset: classroomPreset, custom: classroomCustom.filter((c) => c.url.trim() && c.label.trim()) },
      };
      await settingsApi.updateQuickLinks(token, payload);
      setQuickLinks(payload);
      toast({ title: t('settings.saved') });
    } catch {
      toast({ title: t('settings.saveFailed'), variant: 'destructive' });
    } finally {
      setQuickLinksSaving(false);
    }
  };

  const addLibraryCustom = () => setLibraryCustom((prev) => [...prev, { url: '', label: '' }]);
  const removeLibraryCustom = (i: number) => setLibraryCustom((prev) => prev.filter((_, idx) => idx !== i));
  const updateLibraryCustom = (i: number, field: 'url' | 'label', value: string) =>
    setLibraryCustom((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const addClassroomCustom = () => setClassroomCustom((prev) => [...prev, { url: '', label: '' }]);
  const removeClassroomCustom = (i: number) => setClassroomCustom((prev) => prev.filter((_, idx) => idx !== i));
  const updateClassroomCustom = (i: number, field: 'url' | 'label', value: string) =>
    setClassroomCustom((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

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
        {t('nav.backToDashboard')}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </CardTitle>
          <CardDescription>{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover" unoptimized />
              ) : (
                <User className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{user?.name || t('auth.user')}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="mt-2">{t('nav.profile')}</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('settings.libraryAndClassroom')}
          </CardTitle>
          <CardDescription>{t('settings.libraryAndClassroomDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>{t('settings.libraryPreset')}</Label>
            <select
              value={libraryPreset}
              onChange={(e) => setLibraryPreset(e.target.value as 'google' | 'none')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm w-[200px]"
            >
              <option value="google">{t('settings.googleLibrary')}</option>
              <option value="none">{t('settings.none')}</option>
            </select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('settings.addCustomLibrary')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLibraryCustom}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {libraryCustom.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center rounded border border-border p-2">
                  <Input placeholder={t('settings.customName')} value={c.label} onChange={(e) => updateLibraryCustom(i, 'label', e.target.value)} className="w-32" />
                  <Input type="url" placeholder={t('settings.customUrl')} value={c.url} onChange={(e) => updateLibraryCustom(i, 'url', e.target.value)} className="flex-1 min-w-[180px]" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLibraryCustom(i)} aria-label={t('settings.remove')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label>{t('settings.classroomPreset')}</Label>
            <select
              value={classroomPreset}
              onChange={(e) => setClassroomPreset(e.target.value as 'google' | 'teams' | 'none')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm w-[200px]"
            >
              <option value="google">{t('settings.googleClassroom')}</option>
              <option value="teams">{t('settings.microsoftTeams')}</option>
              <option value="none">{t('settings.none')}</option>
            </select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('settings.addCustomClassroom')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addClassroomCustom}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {classroomCustom.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-center rounded border border-border p-2">
                  <Input placeholder={t('settings.customName')} value={c.label} onChange={(e) => updateClassroomCustom(i, 'label', e.target.value)} className="w-32" />
                  <Input type="url" placeholder={t('settings.customUrl')} value={c.url} onChange={(e) => updateClassroomCustom(i, 'url', e.target.value)} className="flex-1 min-w-[180px]" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeClassroomCustom(i)} aria-label={t('settings.remove')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="button" onClick={handleSaveQuickLinks} disabled={quickLinksSaving}>
            {quickLinksSaving ? t('common.saving') : t('settings.saveLibraryClassroom')}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.integrations')}</CardTitle>
          <CardDescription>{t('settings.integrationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Zoom</span>
              {integrations?.zoom && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <Button variant="outline" size="sm" onClick={handleConnectZoom} disabled={connectingZoom || connectingOutlook}>
              {integrations?.zoom ? 'Reconnect Zoom' : 'Connect Zoom'}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Outlook</span>
              {integrations?.outlook && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <Button variant="outline" size="sm" onClick={handleConnectOutlook} disabled={connectingZoom || connectingOutlook}>
              {integrations?.outlook ? 'Reconnect Outlook' : 'Connect Outlook'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t('settings.desktopAndSupport')}
          </CardTitle>
          <CardDescription>{t('settings.desktopAndSupportDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" asChild>
            <a href="https://github.com/nota-platform/nota-platform/releases" target="_blank" rel="noopener noreferrer">
              <Monitor className="h-4 w-4 mr-2" />
              {t('settings.downloadForPC')}
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:support@nota.app?subject=Nota%20support" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('settings.contactTeam')}
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data: profile, workspaces, pages, tasks, calendar, grades, LMS connections, and preferences. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAccountConfirm(true)}
            disabled={isDeletingAccount}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      {showDeleteAccountConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 outline-none"
          onClick={(e) => e.target === e.currentTarget && !isDeletingAccount && setShowDeleteAccountConfirm(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !isDeletingAccount) {
              e.preventDefault();
              setShowDeleteAccountConfirm(false);
            }
          }}
        >
          <Card className="w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle id="delete-account-title" className="text-lg text-destructive">
                Delete account?
              </CardTitle>
              <CardDescription>
                This will permanently delete all your data: profile, workspaces, tasks, calendar, grades, and settings. You will not be able to recover your account. Are you sure?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteAccountConfirm(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting…' : 'Yes, delete my account'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
