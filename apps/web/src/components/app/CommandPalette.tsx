'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  Settings,
  FolderOpen,
  FileText,
  Plus,
  Search,
  Command,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { workspacesApi } from '@/lib/api';

export const COMMAND_PALETTE_OPEN = 'nota-command-palette-open';
export const NOTA_OPEN_CREATE_WORKSPACE = 'nota-open-create-workspace';
export const NOTA_OPEN_CREATE_PAGE = 'nota-open-create-page';

type ItemType = 'action' | 'workspace' | 'page';

interface CommandItem {
  id: string;
  type: ItemType;
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  keywords: string[];
  run: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = text.toLowerCase();
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}

function filterItems(items: CommandItem[], query: string): CommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter(
    (item) =>
      fuzzyMatch(q, item.label) ||
      (item.subtitle && fuzzyMatch(q, item.subtitle)) ||
      item.keywords.some((k) => fuzzyMatch(q, k))
  );
}

interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string; description: string | null; _count: { pages: number } }>
  >([]);
  const [pages, setPages] = useState<
    Array<{ id: string; title: string; icon: string | null; workspaceId: string; workspaceName: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const workspaceMatch = /^\/workspace\/([^/]+)/.exec(pathname ?? '') ?? /^\/\(app\)\/workspace\/([^/]+)/.exec(pathname ?? '');
  const workspaceId = workspaceMatch?.[1] ?? undefined;

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const ws = await workspacesApi.list(token);
      setWorkspaces(ws);
      const fullWorkspaces = await Promise.all(
        ws.map((w) => workspacesApi.get(token, w.id))
      );
      const allPages: Array<{
        id: string;
        title: string;
        icon: string | null;
        workspaceId: string;
        workspaceName: string;
      }> = [];
      for (const full of fullWorkspaces) {
        const workspaceName = full.name;
        const workspaceId = full.id;
        const pageList = (full.pages ?? []).filter((p) => p.doc != null);
        for (const p of pageList) {
          allPages.push({
            id: p.id,
            title: p.title,
            icon: p.icon ?? null,
            workspaceId,
            workspaceName,
          });
        }
      }
      setPages(allPages);
    } catch {
      setWorkspaces([]);
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && isAuthenticated()) {
      setQuery('');
      setSelectedIndex(0);
      loadData();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, isAuthenticated, loadData]);

  const actions: CommandItem[] = [
    {
      id: 'nav-dashboard',
      type: 'action',
      label: 'Go to Workspaces',
      icon: <LayoutDashboard className="h-4 w-4" />,
      keywords: ['dashboard', 'workspaces', 'home'],
      run: () => {
        onClose();
        router.push('/dashboard');
      },
    },
    {
      id: 'nav-university',
      type: 'action',
      label: 'Go to University',
      icon: <GraduationCap className="h-4 w-4" />,
      keywords: ['courses', 'university', 'lms'],
      run: () => {
        onClose();
        router.push('/dashboard/courses');
      },
    },
    {
      id: 'nav-settings',
      type: 'action',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      keywords: ['settings', 'profile'],
      run: () => {
        onClose();
        router.push('/dashboard/settings');
      },
    },
    {
      id: 'action-new-workspace',
      type: 'action',
      label: 'New workspace',
      icon: <Plus className="h-4 w-4" />,
      keywords: ['create', 'add'],
      run: () => {
        onClose();
        router.push('/dashboard');
        globalThis.dispatchEvent(new CustomEvent(NOTA_OPEN_CREATE_WORKSPACE));
      },
    },
  ];

  if (workspaces.length > 0) {
    const firstId = workspaces[0].id;
    actions.push(
      {
        id: 'nav-tasks',
        type: 'action',
        label: 'Open Tasks',
        icon: <CheckSquare className="h-4 w-4" />,
        keywords: ['tasks', 'todo'],
        run: () => {
          onClose();
          router.push(`/workspace/${firstId}/tasks`);
        },
      },
      {
        id: 'nav-calendar',
        type: 'action',
        label: 'Open Calendar',
        icon: <Calendar className="h-4 w-4" />,
        keywords: ['calendar', 'events'],
        run: () => {
          onClose();
          router.push(`/workspace/${firstId}/calendar`);
        },
      }
    );
  }

  if (workspaceId) {
    actions.push({
      id: 'action-new-page',
      type: 'action',
      label: 'New page',
      icon: <Plus className="h-4 w-4" />,
      keywords: ['create', 'add', 'page'],
      run: () => {
        onClose();
        globalThis.dispatchEvent(new CustomEvent(NOTA_OPEN_CREATE_PAGE));
      },
    });
  }

  const workspaceItems: CommandItem[] = workspaces.map((w) => ({
    id: `ws-${w.id}`,
    type: 'workspace',
    label: w.name,
    subtitle: w.description ?? undefined,
    icon: <FolderOpen className="h-4 w-4" />,
    keywords: [w.description ?? '', w.name].filter(Boolean),
    run: () => {
      onClose();
      router.push(`/workspace/${w.id}`);
    },
  }));

  const pageItems: CommandItem[] = pages.map((p) => ({
    id: `page-${p.id}`,
    type: 'page',
    label: p.title,
    subtitle: p.workspaceName,
    icon: <FileText className="h-4 w-4" />,
    keywords: [p.title, p.workspaceName],
    run: () => {
      onClose();
      router.push(`/workspace/${p.workspaceId}?page=${p.id}`);
    },
  }));

  const allItems: CommandItem[] = [...actions, ...workspaceItems, ...pageItems];
  const filtered = filterItems(allItems, query);
  const selectedItem = filtered[selectedIndex] ?? null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (selectedIndex >= filtered.length && filtered.length > 0) {
      setSelectedIndex(filtered.length - 1);
    }
  }, [selectedIndex, filtered.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !selectedItem) return;
    const option = el.querySelector(`[data-item-id="${selectedItem.id}"]`);
    option?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedItem]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
      return;
    }
    if (e.key === 'Enter' && selectedItem) {
      e.preventDefault();
      selectedItem.run();
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-[20%] z-[101] w-full max-w-xl -translate-x-1/2 px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <Card className="overflow-hidden border shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search workspaces, pages, or run an action..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-autocomplete="list"
              aria-controls="command-palette-list"
              aria-activedescendant={selectedItem ? `cmd-${selectedItem.id}` : undefined}
            />
            <kbd className="hidden shrink-0 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex items-center gap-0.5">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
          <div
            id="command-palette-list"
            ref={listRef}
            className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
            role="listbox"
            aria-label="Results"
          >
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results. Try a different search.
              </div>
            ) : (
              filtered.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  data-item-id={item.id}
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  className={
                    i === selectedIndex
                      ? 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors bg-accent text-accent-foreground'
                      : 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60'
                  }
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => item.run()}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    {item.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                  {item.type === 'workspace' && (
                    <span className="shrink-0 text-xs text-muted-foreground">Workspace</span>
                  )}
                  {item.type === 'page' && (
                    <span className="shrink-0 text-xs text-muted-foreground">Page</span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
