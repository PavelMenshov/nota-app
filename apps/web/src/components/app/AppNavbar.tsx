'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Settings, GraduationCap, LayoutDashboard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotaIcon } from '@/components/NotaIcon';
import { useAuthStore } from '@/lib/store';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Optional search */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-4">
          <div
            className={`relative flex items-center rounded-md border transition-colors ${
              searchFocused ? 'border-primary ring-1 ring-primary/20' : 'border-border bg-muted/30'
            }`}
          >
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
