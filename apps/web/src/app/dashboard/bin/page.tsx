'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trash2, FolderOpen } from 'lucide-react';
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
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [purgingExpired, setPurgingExpired] = useState(false);
  const [emptyingBin, setEmptyingBin] = useState(false);
  const [purgeConfirmId, setPurgeConfirmId] = useState<string | null>(null);
  const [emptyBinConfirm, setEmptyBinConfirm] = useState(false);
  const purgeModalRef = useRef<HTMLDivElement>(null);
  const emptyBinModalRef = useRef<HTMLDivElement>(null);

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

  const openPurgeConfirm = (id: string) => setPurgeConfirmId(id);

  const closePurgeConfirm = () => setPurgeConfirmId(null);

  const confirmPurge = useCallback(async (idOverride?: string) => {
    const id = idOverride ?? purgeConfirmId;
    if (!token || !id) return;
    setPurgeConfirmId(null);
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
  }, [token, purgeConfirmId, toast]);

  useEffect(() => {
    if (!purgeConfirmId) return;
    const el = purgeModalRef.current;
    if (el) (el as HTMLElement).focus();
  }, [purgeConfirmId]);

  useEffect(() => {
    if (!purgeConfirmId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePurgeConfirm();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmPurge(purgeConfirmId);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [purgeConfirmId, confirmPurge]);

  useEffect(() => {
    if (!emptyBinConfirm) return;
    const el = emptyBinModalRef.current;
    if (el) (el as HTMLElement).focus();
  }, [emptyBinConfirm]);

  useEffect(() => {
    if (!emptyBinConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setEmptyBinConfirm(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleEmptyBin();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [emptyBinConfirm]);

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

  const handleEmptyBin = async () => {
    if (!token) return;
    setEmptyBinConfirm(false);
    setEmptyingBin(true);
    try {
      const { deleted } = await workspacesApi.emptyBin(token);
      toast({ title: deleted > 0 ? `${deleted} workspace(s) permanently deleted` : 'Bin is already empty' });
      loadBin();
    } catch {
      toast({ title: 'Failed to empty bin', variant: 'destructive' });
    } finally {
      setEmptyingBin(false);
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
            {t('bin.descriptionNoRestore')}
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
                        variant="destructive"
                        size="sm"
                        onClick={() => openPurgeConfirm(w.id)}
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
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePurgeExpired}
                disabled={purgingExpired || emptyingBin}
              >
                {purgingExpired ? t('common.saving') : t('bin.purgeExpired')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setEmptyBinConfirm(true)}
                disabled={emptyingBin}
              >
                {emptyingBin ? t('common.saving') : t('bin.emptyBin')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty bin confirmation: Escape to cancel, Enter to confirm */}
      {emptyBinConfirm && (
        <div
          ref={emptyBinModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="empty-bin-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 outline-none"
          onClick={(e) => e.target === e.currentTarget && setEmptyBinConfirm(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); setEmptyBinConfirm(false); }
            if (e.key === 'Enter') { e.preventDefault(); handleEmptyBin(); }
          }}
        >
          <Card className="w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle id="empty-bin-title" className="text-lg">{t('bin.emptyBinConfirmTitle')}</CardTitle>
              <CardDescription>{t('bin.emptyBinConfirmMessage')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEmptyBinConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleEmptyBin} disabled={emptyingBin}>
                {emptyingBin ? t('common.saving') : t('bin.emptyBin')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permanent delete confirmation modal: Cancel (button or Esc), Confirm (button or Enter) */}
      {purgeConfirmId && (
        <div
          ref={purgeModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-confirm-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 outline-none"
          onClick={(e) => e.target === e.currentTarget && closePurgeConfirm()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); closePurgeConfirm(); }
            if (e.key === 'Enter') { e.preventDefault(); confirmPurge(); }
          }}
        >
          <Card className="w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle id="purge-confirm-title" className="text-lg">{t('bin.confirmPurgeTitle')}</CardTitle>
              <CardDescription>{t('bin.confirmPurgeMessage')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closePurgeConfirm}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmPurge}>
                {t('bin.confirm')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
