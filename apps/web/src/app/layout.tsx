import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'EYWA Platform - All-in-One Academic Ecosystem',
  description: 'A unified academic ecosystem for university students and faculty, combining notes, PDF annotations, interactive whiteboards, tasks, and calendar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
