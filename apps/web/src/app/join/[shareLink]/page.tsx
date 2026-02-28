'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { workspacesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function JoinWorkspacePage() {
  const params = useParams();
  const shareLink = params.shareLink as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || `/join/${shareLink}`;
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'joining' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!shareLink) {
      setStatus('error');
      return;
    }
    if (!isAuthenticated()) {
      router.replace(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!token) {
      setStatus('loading');
      return;
    }
    setStatus('joining');
    workspacesApi
      .joinByShareLink(token, shareLink)
      .then((workspace) => {
        setStatus('done');
        toast({ title: 'Joined workspace', description: workspace.name });
        router.replace(`/workspace/${workspace.id}`);
      })
      .catch(() => {
        setStatus('error');
        toast({ title: 'Invalid or disabled link', variant: 'destructive' });
      });
  }, [shareLink, token, isAuthenticated, router, returnUrl, toast]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Invalid or disabled invite link.</p>
        <a href="/dashboard" className="text-primary hover:underline">Go to dashboard</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Joining workspace...</p>
    </div>
  );
}
