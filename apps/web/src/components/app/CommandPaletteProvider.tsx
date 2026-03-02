'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { CommandPalette, COMMAND_PALETTE_OPEN } from './CommandPalette';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';

const ShortcutsOpenContext = createContext<(() => void) | null>(null);
export function useOpenShortcuts() {
  return useContext(ShortcutsOpenContext);
}

export function CommandPaletteProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openCommand = useCallback(() => {
    setShortcutsOpen(false);
    setCommandOpen(true);
  }, []);

  const openShortcuts = useCallback(() => {
    setCommandOpen(false);
    setShortcutsOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommand();
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? '');
        if (!isInput) {
          e.preventDefault();
          openShortcuts();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openCommand, openShortcuts]);

  useEffect(() => {
    const onOpen = () => openCommand();
    globalThis.addEventListener(COMMAND_PALETTE_OPEN, onOpen);
    return () => globalThis.removeEventListener(COMMAND_PALETTE_OPEN, onOpen);
  }, [openCommand]);

  useEffect(() => {
    setCommandOpen(false);
    setShortcutsOpen(false);
  }, [pathname]);

  return (
    <ShortcutsOpenContext.Provider value={openShortcuts}>
      {children}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <KeyboardShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </ShortcutsOpenContext.Provider>
  );
}
