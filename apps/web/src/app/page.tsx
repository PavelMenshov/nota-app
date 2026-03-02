'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { NotaIcon } from '@/components/NotaIcon';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FOCUS_RING =
  'focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md';

function Reveal({
  children,
  className,
  style,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}>) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-visible={visible}
      className={cn('animate-fade-slide-up', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { ref: featuresSectionRef, visible: featuresSectionVisible } =
    useInView<HTMLDivElement>({ rootMargin: '0px 0px -5% 0px' });

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      title: 'Notes & docs',
      description:
        'Rich documents with version history, share links, and role-based access. One page can host multiple sources.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Canvas & whiteboard',
      description:
        'Sketch, brainstorm, and collaborate in real time. Switch between doc and canvas without leaving the page.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'PDFs & annotations',
      description:
        'Upload PDFs to any page. Highlight, annotate, and pull highlights into your doc with one click.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Workspaces & pages',
      description:
        'Organize by course or project. Nested pages with doc, canvas, and PDF sources—linkable and shareable.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: 'Real-time collaboration',
      description:
        'Edit docs and canvas together. Presence, optional cursors, and conflict-free sync for study groups and faculty.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Tasks & calendar',
      description:
        'Tasks with deadlines and status linked to pages. Calendar events for deadlines and office hours.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const steps = [
    { step: 1, title: 'Sign in with your university', body: 'Use your university SSO to log in. Nota connects to your institution—no extra passwords, and your Zoom, Outlook, and LMS access follow.' },
    { step: 2, title: 'One place for courses & deadlines', body: 'Workspaces for each course or project. Pages with docs, canvas, and PDFs. Deadlines and important dates from your LMS (e.g. Blackboard) sync into Nota\'s calendar and tasks.' },
    { step: 3, title: 'Meetings & collaboration in one app', body: 'Connect Zoom and Outlook once; create Zoom meetings from calendar events and add events to Outlook. Get notified about upcoming deadlines, meetings, and collaboration requests.' },
    { step: 4, title: 'Collaborate & share', body: 'Invite others to workspaces, set roles, and export to PDF or DOCX. Everything you use as a student—LMS, mail, meetings, notes—lives in one place.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="#top"
            className={cn('flex items-center gap-2.5 font-semibold tracking-tight text-foreground no-underline', FOCUS_RING)}
          >
            <NotaIcon size={32} className="shrink-0" />
            Nota
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="#features" className={cn('text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors', FOCUS_RING)}>
              Features
            </Link>
            <Link href="#how-it-works" className={cn('text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors', FOCUS_RING)}>
              How it works
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className={cn('rounded-md h-9', FOCUS_RING)}>
                Sign in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className={cn('rounded-md h-9 bg-primary hover:bg-primary/90', FOCUS_RING)}>
                Get started
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn('md:hidden h-9 w-9 rounded-md border border-border flex items-center justify-center', FOCUS_RING)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-2 px-4 flex flex-col gap-1">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className={cn('text-sm text-muted-foreground hover:text-foreground py-2', FOCUS_RING)}>
              Features
            </Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className={cn('text-sm text-muted-foreground hover:text-foreground py-2', FOCUS_RING)}>
              How it works
            </Link>
          </div>
        )}
      </header>

      <main id="top" className="relative">
        {/* Hero — one headline + CTA */}
        <section className="pt-16 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-foreground">
                Notes, canvas & PDFs in one workspace.{' '}
                <span className="text-primary">Built for academia.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-muted-foreground text-lg leading-relaxed">
                The page-first workspace that replaces fragmented tools: docs, whiteboards, and PDFs live on each page. Versioned, shareable, and designed for students and faculty—without the clutter.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/auth/register" className={cn('inline-flex', FOCUS_RING)}>
                  <Button
                    size="lg"
                    className="h-12 px-7 text-base font-semibold rounded-full cta-primary-shimmer cta-shimmer-animate text-white border-0 shadow-[0_16px_34px_rgba(31,122,74,0.18)]"
                  >
                    Get started free
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className={cn('h-12 px-7 text-base font-semibold rounded-full border-border bg-card/80 hover:bg-card', FOCUS_RING)}
                  onClick={scrollToFeatures}
                >
                  See features
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Social proof — For universities */}
        <section className="py-10 sm:py-14 border-y border-border/60 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                For universities & institutions
              </p>
              <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto text-base">
                Replace fragmented tools with one workspace. Nota fits your existing workflows and integrates with university data and LMS—so students and faculty stay in one place.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Features — one cohesive section with stagger on scroll */}
        <section
          id="features"
          ref={featuresSectionRef}
          data-visible={featuresSectionVisible}
          className="py-14 sm:py-20 features-section-reveal"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Everything you need in one place
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-2xl">
                Everything students use in one place: workspaces, notes, canvas, PDFs, tasks, calendar, and integrations with your LMS, Zoom, and Outlook.
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card landing-card-hover rounded-2xl border border-border bg-card p-6 h-full flex flex-col"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-14 sm:py-20 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                How it works
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-2xl">
                Nota is built for students: one place for your LMS, calendar, meetings, mail, and notes. Sign in with your university and bring it all together.
              </p>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
              {steps.map((item) => (
                <Reveal key={item.step}>
                  <div className="flex sm:flex-col gap-4 sm:gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0" aria-hidden>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Ready to try Nota?
                </h2>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                  Create a free account, add a workspace, and start with notes, canvas, and PDFs in one place.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/auth/register" className={cn('inline-flex', FOCUS_RING)}>
                    <Button
                      size="lg"
                      className="h-12 px-7 text-base font-semibold rounded-full cta-primary-shimmer text-white border-0 shadow-[0_16px_34px_rgba(31,122,74,0.18)]"
                    >
                      Get started free
                    </Button>
                  </Link>
                  <Link href="/auth/login" className={cn('inline-flex', FOCUS_RING)}>
                    <Button
                      variant="outline"
                      size="lg"
                      className={cn('h-12 px-7 text-base font-semibold rounded-full', FOCUS_RING)}
                    >
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border bg-muted/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
              <div>
                <div className="flex items-center gap-2.5 font-extrabold tracking-tight text-foreground">
                  <NotaIcon size={34} className="shadow-[0_10px_20px_rgba(31,122,74,0.12)]" />
                  <span>Nota</span>
                </div>
                <p className="mt-2 text-muted-foreground text-sm max-w-md">
                  Calm UI, strong model: workspace › pages › surfaces. Versioned, shareable, collaborative—designed for academic flow.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <a
                    href={`${API_URL}/api/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-primary hover:underline', FOCUS_RING)}
                  >
                    API docs
                  </a>
                  <a
                    href="https://github.com/PavelMenshov/nota-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('text-primary hover:underline', FOCUS_RING)}
                  >
                    GitHub
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="#features" className={cn('px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors', FOCUS_RING)}>
                  Features
                </Link>
                <Link href="#how-it-works" className={cn('px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors', FOCUS_RING)}>
                  How it works
                </Link>
                <Link href="/auth/login" className={cn('px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors', FOCUS_RING)}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
