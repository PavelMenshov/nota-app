'use client';

import { useEffect } from 'react';
import { setConfig } from '@/lib/config-store';

/**
 * When the web app runs inside the Nota desktop app (Electron), sync the API URL
 * from the desktop's persistent store into the web app config on load.
 * This lets the desktop app set a default API URL and persist user changes.
 */
export function DesktopConfigSync() {
  useEffect(() => {
    const api = typeof window !== 'undefined' ? (window as unknown as { electronAPI?: { getApiUrl?: () => Promise<string | undefined> } }).electronAPI : undefined;
    if (!api?.getApiUrl) return;

    api.getApiUrl().then((url) => {
      if (url && typeof url === 'string' && url.trim()) {
        setConfig({ apiUrl: url.trim() });
      }
    }).catch(() => {
      // ignore
    });
  }, []);

  return null;
}
