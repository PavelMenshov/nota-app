'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '@/lib/config-store';

interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  cursor?: { x: number; y: number };
  selection?: unknown;
}

interface UseRealtimeOptions {
  pageId: string;
  token: string | null;
  onDocUpdate?: (update: Uint8Array | number[]) => void;
  onCanvasUpdate?: (update: Uint8Array | number[]) => void;
}

export function useRealtime({ pageId, token, onDocUpdate, onCanvasUpdate }: UseRealtimeOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);

  // Store callbacks in refs to avoid reconnecting when they change
  const onDocUpdateRef = useRef(onDocUpdate);
  const onCanvasUpdateRef = useRef(onCanvasUpdate);
  onDocUpdateRef.current = onDocUpdate;
  onCanvasUpdateRef.current = onCanvasUpdate;

  useEffect(() => {
    if (!token || !pageId) return;

    // Connect to the realtime namespace
    const apiUrl = getApiUrl();
    const socket = io(`${apiUrl}/realtime`, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_page', { pageId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('user_joined', (data: { userId: string; name: string; avatarUrl?: string }) => {
      setPresenceUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, name: data.name, avatarUrl: data.avatarUrl }];
      });
    });

    socket.on('user_left', (data: { userId: string }) => {
      setPresenceUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    socket.on('presence_update', (data: PresenceUser | PresenceUser[]) => {
      const updates = Array.isArray(data) ? data : [data];
      setPresenceUsers((prev) => {
        const next = [...prev];
        for (const u of updates) {
          const idx = next.findIndex((p) => p.userId === u.userId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...u };
          } else {
            next.push(u);
          }
        }
        return next;
      });
    });

    socket.on('doc_update', (data: { senderId: string; update: Uint8Array | number[] }) => {
      onDocUpdateRef.current?.(data.update);
    });

    socket.on('canvas_update', (data: { senderId: string; update: Uint8Array | number[] }) => {
      onCanvasUpdateRef.current?.(data.update);
    });

    socket.on('error', (err: { message: string }) => {
      console.error('Realtime error:', err.message);
    });

    return () => {
      socket.emit('leave_page');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setPresenceUsers([]);
    };
  }, [token, pageId]);

  const sendDocUpdate = useCallback((update: Uint8Array | number[]) => {
    socketRef.current?.emit('doc_update', { update });
  }, []);

  const sendCanvasUpdate = useCallback((update: Uint8Array | number[]) => {
    socketRef.current?.emit('canvas_update', { update });
  }, []);

  const sendPresenceUpdate = useCallback((data: { cursor?: { x: number; y: number }; selection?: unknown }) => {
    socketRef.current?.emit('presence_update', data);
  }, []);

  return {
    connected,
    presenceUsers,
    sendDocUpdate,
    sendCanvasUpdate,
    sendPresenceUpdate,
  };
}
