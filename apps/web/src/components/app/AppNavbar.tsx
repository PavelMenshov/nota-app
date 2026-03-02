'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Settings, GraduationCap, LayoutDashboard, Search, Command, HelpCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotaIcon } from '@/components/NotaIcon';
import { useAuthStore } from '@/lib/store';
import { useOpenShortcuts } from './CommandPaletteProvider';
import { COMMAND_PALETTE_OPEN } from './CommandPalette';
import { notificationsApi } from '@/lib/api';

interface AppNavbarProps {
  /** When true, show "Back to Dashboard" in nav (e.g. inside workspace) */
  showBackToDashboard?: boolean;
  /** Optional workspace name to show in nav when inside a workspace */
  workspaceName?: string | null;
}

export function AppNavbar({ showBackToDashboard, workspaceName }: Readonly<AppNavbarProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const openShortcuts = useOpenShortcuts();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    read: boolean;
    link: string | null;
    relatedId: string | null;
    createdAt: string;
  }>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { token } = useAuthStore();

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setNotificationsLoading(true);
    try {
      const list = await notificationsApi.list(token);
      setNotifications(list);
    } catch {
      // Non-blocking
    } finally {
      setNotificationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (notificationsOpen && token) {
      fetchNotifications();
    }
  }, [notificationsOpen, token, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: { id: string; read: boolean; link: string | null }) => {
    if (!token) return;
    if (!n.read) {
      try {
        await notificationsApi.markRead(token, n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.link) {
      setNotificationsOpen(false);
      router.push(n.link);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard');
  const isWorkspace = pathname.startsWith('/workspace/');

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-[1600px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-foreground no-underline shrink-0"
          >
            <NotaIcon size={32} className="shrink-0 rounded-lg" />
            <span className="font-semibold text-foreground tracking-tight hidden sm:inline">Nota</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard/courses"
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                pathname === '/dashboard/courses'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                University
              </span>
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                isDashboard && pathname !== '/dashboard/courses'
                  ? 'bg-muted/80 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Workspaces
              </span>
            </Link>
            {showBackToDashboard && isWorkspace && (
              <Link
                href="/dashboard"
                className="text-sm font-medium px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80"
              >
                Back to Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Command palette trigger */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-4">
          <button
            type="button"
            onClick={() => globalThis.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN))}
            className="relative flex w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Open command palette (Ctrl+K)"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Search workspaces, pages…</span>
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs sm:inline-flex items-center gap-0.5">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-expanded={notificationsOpen}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
              )}
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-[360px] rounded-lg border border-border bg-card shadow-lg z-20 flex flex-col">
                <div className="px-3 py-2 border-b border-border font-medium text-sm text-foreground">
                  Notifications
                </div>
                <div className="overflow-y-auto flex-1 min-h-0">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    <ul className="py-1">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/80 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <p className="font-medium text-foreground truncate">{n.title}</p>
                            {n.body && <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.body}</p>}
                            <p className="text-muted-foreground text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          {openShortcuts && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={openShortcuts}
              aria-label="Keyboard shortcuts (?)"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          )}
          {workspaceName && (
            <span className="text-sm text-muted-foreground truncate max-w-[120px] hidden xl:inline">
              {workspaceName}
            </span>
          )}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </Button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-20 py-2">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 border-b border-border">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start rounded-none h-9 px-3">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start rounded-none h-9 px-3">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-none h-9 px-3"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
