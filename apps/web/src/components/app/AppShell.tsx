'use client';

import { usePathname } from 'next/navigation';
import { AppNavbar } from './AppNavbar';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const showBackToDashboard = pathname?.startsWith('/workspace/') ?? false;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <AppNavbar showBackToDashboard={showBackToDashboard} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
