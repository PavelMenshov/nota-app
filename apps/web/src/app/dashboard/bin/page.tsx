'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trash2, RotateCcw, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { workspacesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

const BIN_RETENTION_DAYS = 14;

interface BinWorkspace {
  id: string;
  name: string;
  description: string | null;
  deletedAt: string;
  _count: { pages: number };
}

function daysUntilPurge(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const purgeAt = deleted + BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return Math.max(0, Math.ceil((purgeAt - now) / (24 * 60 * 60 * 1000)));
}

function daysAgo(deletedAt: string): number {
  return Math.floor((Date.now() - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000));
}

export default function DashboardBinPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const { t } = useLocale();
  const [items, setItems] = useState<BinWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [purgingExpired, setPurgingExpired] = useState(false);

  const loadBin = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await workspacesApi.listBin(token);
      setItems(list);
    } catch {
      toast({ title: 'Failed to load bin', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    loadBin();
  }, [isAuthenticated, router, loadBin]);

  const handleRestore = async (id: string) => {
    if (!token) return;
    setRestoringId(id);
    try {
      await workspacesApi.restore(token, id);
      toast({ title: 'Workspace restored' });
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch {
      toast({ title: 'Failed to restore', variant: 'destructive' });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePurge = async (id: string) => {
    if (!token) return;
    if (!confirm('Permanently delete this workspace? This cannot be undone.')) return;
    setPurgingId(id);
    try {
      await workspacesApi.deletePermanent(token, id);
      toast({ title: 'Workspace permanently deleted' });
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch {
      toast({ title: 'Failed to delete permanently', variant: 'destructive' });
    } finally {
      setPurgingId(null);
    }
  };

  const handlePurgeExpired = async () => {
    if (!token) return;
    setPurgingExpired(true);
    try {
      const { purged } = await workspacesApi.purgeExpiredBin(token);
      if (purged > 0) {
        toast({ title: `${purged} workspace(s) permanently deleted` });
        loadBin();
      } else {
        toast({ title: 'No expired items to purge' });
      }
    } catch {
      toast({ title: 'Failed to purge expired', variant: 'destructive' });
    } finally {
      setPurgingExpired(false);
    }
  };

  if (!token) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
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
            <Trash2 className="h-5 w-5" />
            {t('bin.title')}
          </CardTitle>
          <CardDescription>
            {t('bin.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FolderOpen className="h-12 w-12 opacity-50" />
              <p>{t('bin.empty')}</p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">{t('bin.backToWorkspaces')}</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((w) => {
                const untilPurge = daysUntilPurge(w.deletedAt);
                const ago = daysAgo(w.deletedAt);
                const deletedText = ago === 0
                  ? t('bin.deletedToday')
                  : t('bin.deletedDaysAgo', { count: ago });
                const purgeText = untilPurge > 0
                  ? t('bin.purgeInDays', { count: untilPurge })
                  : '';
                return (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {deletedText}
                        {purgeText && ` · ${purgeText}`}
                      </p>
                      {w._count.pages > 0 && (
                        <p className="text-xs text-muted-foreground">{w._count.pages} page(s)</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(w.id)}
                        disabled={restoringId !== null}
                      >
                        {restoringId === w.id ? t('common.saving') : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {t('dashboard.restore')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePurge(w.id)}
                        disabled={purgingId !== null}
                      >
                        {purgingId === w.id ? t('common.saving') : t('dashboard.deletePermanent')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePurgeExpired}
                disabled={purgingExpired}
              >
                {purgingExpired ? t('common.saving') : t('bin.purgeExpired')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
