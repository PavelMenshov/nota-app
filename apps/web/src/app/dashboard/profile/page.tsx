'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export default function DashboardProfilePage() {
  const router = useRouter();
  const { token, user, updateUser, isAuthenticated } = useAuthStore();
  const { t } = useLocale();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      .catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, [token, isAuthenticated, router, toast]);

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
      toast({ title: t('settings.profileSaved') });
    } catch {
      toast({ title: t('settings.saveFailed'), variant: 'destructive' });
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
        {t('nav.backToDashboard')}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('nav.profile')}
          </CardTitle>
          <CardDescription>{t('settings.profileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 pb-4 border-b border-border mb-6">
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
              <p className="font-medium text-foreground">{user?.name || t('auth.user')}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t('settings.displayName')}</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.displayNamePlaceholder')}
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-avatar">{t('settings.avatarUrl')}</Label>
              <Input
                id="profile-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">{t('settings.avatarUrlHint')}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('common.saving') : t('common.save')}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">{t('common.cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
