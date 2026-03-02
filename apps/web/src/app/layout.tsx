import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { DesktopConfigSync } from '@/components/DesktopConfigSync';
import { ClientLocaleWrapper } from '@/components/ClientLocaleWrapper';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nota.app';
let metadataBase: URL;
try {
  metadataBase = new URL(siteUrl);
} catch {
  metadataBase = new URL('https://nota.app');
}

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'Nota — Notes, PDFs & Canvas in One Workspace',
    template: '%s | Nota',
  },
  description: 'One workspace for notes, canvas, and PDFs — connected by design. Academic page-first OS: versioned, shareable, collaborative.',
  keywords: ['notes', 'PDF', 'canvas', 'workspace', 'academic', 'study', 'collaboration'],
  authors: [{ name: 'Nota', url: siteUrl }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Nota',
    title: 'Nota — Notes, PDFs & Canvas in One Workspace',
    description: 'One workspace for notes, canvas, and PDFs — connected by design. Versioned, shareable, collaborative.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Nota' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nota — Notes, PDFs & Canvas in One Workspace',
    description: 'One workspace for notes, canvas, and PDFs — connected by design.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakarta.variable}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <DesktopConfigSync />
        <ClientLocaleWrapper>
          {children}
        </ClientLocaleWrapper>
        <Toaster />
      </body>
    </html>
  );
}
