'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { shareApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState<Awaited<ReturnType<typeof shareApi.getPageByShareLink>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Missing share link');
      return;
    }
    shareApi
      .getPageByShareLink(token)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Invalid or expired link'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <p className="text-destructive mb-4">{error ?? 'Page not found'}</p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  const plainText = page.doc?.plainText ?? '';
  const openInWorkspace = isAuthenticated()
    ? `/workspace/${page.workspace.id}/page/${page.id}`
    : `/auth/login?redirect=${encodeURIComponent('/workspace/' + page.workspace.id + '/page/' + page.id)}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{page.workspace.name}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">{page.title}</span>
          </div>
          <Link href={openInWorkspace}>
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {isAuthenticated() ? 'Open in Nota' : 'Log in to open'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <FileText className="h-4 w-4" />
            <span>Shared page (read-only)</span>
          </div>
          {plainText ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{plainText}</pre>
          ) : (
            <p className="text-muted-foreground text-sm">No document content.</p>
          )}
        </div>

        {page.sources.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-foreground mb-2">Attached sources ({page.sources.length})</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {page.sources.map((s) => (
                <li key={s.id}>{s.fileName}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
