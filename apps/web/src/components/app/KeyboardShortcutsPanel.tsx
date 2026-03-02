'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, X } from 'lucide-react';

interface ShortcutRow {
  keys: string[];
  description: string;
}

function isMac() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Mac|iPod|iPhone|iPad/.test(ua);
}

function getShortcuts(): ShortcutRow[] {
  const mod = isMac() ? '⌘' : 'Ctrl';
  return [
    { keys: [mod, 'K'], description: 'Open command palette' },
    { keys: ['?'], description: 'Show this shortcuts panel' },
    { keys: ['Escape'], description: 'Close modal or panel' },
    { keys: ['Enter'], description: 'Confirm or select (e.g. in palette)' },
    { keys: ['↑', '↓'], description: 'Move selection in command palette' },
    { keys: ['Tab', 'Shift+Tab'], description: 'Move focus between elements' },
  ];
}

export interface KeyboardShortcutsPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function KeyboardShortcutsPanel({ open, onClose }: KeyboardShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  const getFocusables = useCallback(() => {
    if (!panelRef.current) return [];
    return Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const idx = current ? focusables.indexOf(current) : -1;
      if (e.shiftKey && idx <= 0) {
        e.preventDefault();
        focusables.at(-1)?.focus();
      } else if (!e.shiftKey && (idx === -1 || idx >= focusables.length - 1)) {
        e.preventDefault();
        focusables[0]?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, getFocusables]);

  if (!open) return null;

  const displayShortcuts = getShortcuts();

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-[101] h-full w-full max-w-sm border-l border-border bg-card shadow-lg sm:max-w-md flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        ref={panelRef}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
          <h2 id="keyboard-shortcuts-title" className="flex items-center gap-2 text-lg font-semibold">
            <Keyboard className="h-5 w-5 text-muted-foreground" aria-hidden />
            Keyboard shortcuts
          </h2>
          <Button
            ref={closeBtnRef}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClose}
            aria-label="Close shortcuts panel"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          <ul className="space-y-3" aria-labelledby="keyboard-shortcuts-title">
            {displayShortcuts.map((row, i) => (
              <li
                key={`${row.description}-${i}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <span className="text-sm text-foreground">{row.description}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {row.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Use the command palette to jump to any workspace, open a page, go to Tasks or Calendar, or run actions like New workspace and New page.
          </p>
        </div>
      </div>
    </>
  );
}
