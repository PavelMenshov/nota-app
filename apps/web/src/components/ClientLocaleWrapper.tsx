'use client';

import { LocaleProvider } from '@/contexts/LocaleContext';

export function ClientLocaleWrapper({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
