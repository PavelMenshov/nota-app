'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EywaIcon } from '@/components/EywaIcon';

// Use environment variable or default to localhost for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbfaf7] via-[#fbfaf7] to-[#f8f6f2]">
      {/* Radial gradient overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-[18%] w-[900px] h-[520px] bg-gradient-radial from-[rgba(31,122,74,0.10)] to-transparent opacity-55 -translate-y-[10%]" />
        <div className="absolute top-0 right-[18%] w-[900px] h-[520px] bg-gradient-radial from-[rgba(31,122,74,0.06)] to-transparent opacity-60" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-[rgba(251,250,247,0.76)] backdrop-blur-[10px] border-b border-[rgba(20,20,20,0.07)]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="h-[70px] flex items-center justify-between gap-4">
            {/* Brand */}
            <Link href="#top" className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#141414]">
              <EywaIcon size={34} className="shadow-[0_10px_20px_rgba(31,122,74,0.12)]" />
              <span className="text-base">EYWA</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              <Link href="#core" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                Core
              </Link>
              <Link href="#collab" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                Collaboration
              </Link>
              <Link href="#pdf" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                PDF
              </Link>
              <Link href="#export" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                Export
              </Link>
              <Link href="#tasks" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                Tasks
              </Link>
              <Link href="#docs" className="text-[13px] text-[#5b6167] px-3 py-2 rounded-full hover:bg-[rgba(20,20,20,0.05)] hover:text-[#141414] transition-all">
                Docs
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <Link href="/auth/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="h-10 px-3.5 text-[13px] font-bold rounded-full border border-[rgba(20,20,20,0.10)] bg-white hover:bg-[rgba(255,255,255,0.92)] hover:border-[rgba(20,20,20,0.16)] shadow-[0_10px_26px_rgba(20,20,20,0.06)] transition-all">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="h-10 px-3.5 text-[13px] font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)] hover:from-[#1f7a4a] hover:to-[rgba(31,122,74,0.86)] hover:border-[rgba(31,122,74,0.55)] transition-all">
                  Get started
                </Button>
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-[42px] h-[42px] rounded-full border border-[rgba(20,20,20,0.10)] bg-white shadow-[0_10px_26px_rgba(20,20,20,0.06)] flex items-center justify-center"
                aria-label="Open menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-2.5 border-t border-[rgba(20,20,20,0.07)] pb-3.5">
              <Link href="#core" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                Core
              </Link>
              <Link href="#collab" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                Collaboration
              </Link>
              <Link href="#pdf" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                PDF
              </Link>
              <Link href="#export" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                Export
              </Link>
              <Link href="#tasks" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                Tasks
              </Link>
              <Link href="#docs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 mt-2 rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.7)] text-[#5b6167] font-semibold text-[13px]">
                Docs
              </Link>
            </div>
          )}
        </div>
      </header>

      <main id="top" className="relative">
        {/* Hero */}
        <section className="pt-[62px] pb-7">
          <div className="max-w-[1140px] mx-auto px-6">
            {/* Kicker */}
            <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12.5px] font-bold">
              <div className="w-[9px] h-[9px] rounded-full bg-[#21a061] shadow-[0_0_0_4px_rgba(31,122,74,0.10)]" />
              Calm like Notion - built for PDFs, deadlines, and study loops
            </div>

            {/* H1 */}
            <h1 className="mt-3.5 text-[clamp(38px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#141414]">
              One workspace for notes, canvas, and PDFs -{' '}
              <span className="text-[#1f7a4a]">connected by design</span>.
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 max-w-[62ch] text-[#5b6167] text-[15.5px] leading-[1.7]">
              EYWA is the academic "page-first" OS: a workspace contains pages, and each page can host surfaces
              (doc, canvas, PDFs). Everything stays linkable, versioned, and shareable - without visual noise.
            </p>

            {/* CTAs */}
            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)]">
                  Start free
                </Button>
              </Link>
              <Link href="#core">
                <Button variant="ghost" size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.90)] hover:border-[rgba(20,20,20,0.14)] text-[#141414]">
                  See the architecture
                </Button>
              </Link>
            </div>

            {/* Showcase */}
            <div className="mt-[22px] rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] overflow-hidden">
              {/* Showcase header */}
              <div className="h-11 flex items-center justify-between px-3.5 border-b border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.78)]">
                <div className="flex gap-2 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,92,92,0.78)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,201,71,0.80)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(56,196,112,0.80)]" />
                </div>
                <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)]">
                  EYWA • workspace preview
                </div>
                <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)] opacity-60 hidden sm:block">
                  pages • docs • pdf
                </div>
              </div>

              {/* Showcase body */}
              <div className="p-3.5 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-3.5">
                {/* Page preview */}
                <div className="rounded-2xl border border-[rgba(20,20,20,0.07)] bg-white p-[18px] min-h-[420px] relative">
                  <div className="w-[38px] h-[38px] rounded-xl border border-[rgba(20,20,20,0.07)] bg-[rgba(31,122,74,0.08)] grid place-items-center text-[#1f7a4a] font-black text-lg">
                    E
                  </div>
                  <h3 className="mt-3 text-[22px] font-bold tracking-tight">Acme Inc. • Semester Hub</h3>

                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="rounded-[14px] border border-[rgba(20,20,20,0.07)] bg-[rgba(251,250,247,0.75)] p-3">
                      <h4 className="font-mono text-[12px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)]">Policies</h4>
                      <div className="mt-2.5 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          📌 Course outline
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">doc</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          🗂 Reading list
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">pdf</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          🧠 Study system
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">canvas</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-[rgba(20,20,20,0.07)] bg-[rgba(251,250,247,0.75)] p-3">
                      <h4 className="font-mono text-[12px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)]">Company Priorities</h4>
                      <div className="mt-2.5 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          ✅ Problem Set 4
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">task</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          🗓 Office hours
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">event</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                          ⭐ Exam prep
                          <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">plan</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 rounded-[14px] border border-[rgba(20,20,20,0.07)] bg-[rgba(251,250,247,0.75)] p-3">
                    <h4 className="font-mono text-[12px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)]">Roadmap</h4>
                    <div className="mt-2.5 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                        Launch AI-assisted onboarding
                        <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">status</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                        Migrate to modern cloud
                        <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">priority</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[rgba(20,20,20,0.06)] bg-[rgba(255,255,255,0.8)] text-[#5b6167] text-[13px]">
                        Build GTM capabilities
                        <span className="ml-auto font-mono text-[10px] tracking-[0.10em] uppercase px-2 py-1.5 rounded-full border border-[rgba(31,122,74,0.20)] bg-[rgba(31,122,74,0.08)] text-[rgba(20,20,20,0.72)]">by team</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Assistant */}
                <div className="rounded-2xl border border-[rgba(20,20,20,0.07)] bg-white p-3.5 min-h-[420px] flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-[rgba(20,20,20,0.07)]">
                    <div>
                      <div className="font-bold text-[13px]">AI Study Assistant</div>
                      <div className="text-[12px] text-[#7a828a]">Grounded in your pages & PDFs</div>
                    </div>
                    <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded-lg border border-[rgba(20,20,20,0.12)] bg-[rgba(255,255,255,0.9)] text-[rgba(20,20,20,0.78)]">⌘ K</kbd>
                  </div>

                  <div className="border border-[rgba(20,20,20,0.07)] bg-[rgba(251,250,247,0.80)] rounded-[14px] px-3 py-2.5 text-[#5b6167] text-[13px] leading-[1.6]">
                    <strong className="text-[#141414]">Turn this page into a hub</strong> for your course notes, roadmap, and priorities.
                    I can create a "Roadmap" database, extract highlights from PDFs into doc blocks, and schedule review sessions.
                  </div>

                  <div className="border border-[rgba(20,20,20,0.07)] bg-[rgba(251,250,247,0.80)] rounded-[14px] px-3 py-2.5 text-[#5b6167] text-[13px] leading-[1.6]">
                    <strong className="text-[#141414]">Found:</strong> 96 results across <em>docs</em>, <em>PDF highlights</em>, and <em>tasks</em>.<br />
                    Want me to group by <strong className="text-[#141414]">Week</strong> or by <strong className="text-[#141414]">Course</strong>?
                  </div>

                  <div className="mt-auto flex gap-2.5 flex-wrap pt-2.5 border-t border-[rgba(20,20,20,0.07)] text-[#7a828a] text-[12px]">
                    <span className="inline-flex items-center gap-2 px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.85)]">
                      <div className="w-2 h-2 rounded-full bg-[#21a061]" />
                      All sources
                    </span>
                    <span className="inline-flex items-center gap-2 px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.85)]">
                      <div className="w-2 h-2 rounded-full bg-[#21a061]" />
                      Versioned
                    </span>
                    <span className="inline-flex items-center gap-2 px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.85)]">
                      <div className="w-2 h-2 rounded-full bg-[#21a061]" />
                      Shareable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA box */}
            <div className="mt-[18px] rounded-[26px] border border-[rgba(20,20,20,0.07)] bg-gradient-to-b from-[rgba(255,255,255,0.86)] to-[rgba(255,255,255,0.70)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] p-5 flex items-center justify-between gap-3.5 flex-wrap" id="get-started">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Ship a clean v1 fast.</h3>
                <p className="mt-1.5 text-[#5b6167] text-[13.5px] leading-[1.6] max-w-[70ch]">
                  Start with the core page model, PDF annotations, and tasks/calendar. Add export + "Send to Notion" as a lightweight bridge.
                </p>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <Link href="/auth/register">
                  <Button size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)]">
                    Create workspace
                  </Button>
                </Link>
                <Link href="#core">
                  <Button variant="ghost" size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.90)] hover:border-[rgba(20,20,20,0.14)]">
                    View spec
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        <Section
          id="core"
          title="1.1 Workspace / Page (Core)"
          description="Workspace -> Pages. A page contains 'surfaces': doc, canvas, and PDF (PDF as attached file + annotations). Version history + audit trail, link sharing, and role-based access."
        >
          <FeatureRow
            title="Page = container for surfaces"
            description="Keep UX simple: users open a page and switch surfaces (Doc / Canvas / PDFs) without navigating away. This is the 'Notion feeling' but purpose-built for academic assets."
            note="Suggested primitives: workspace_id, page_id, surface_type, object_ref"
            capabilities={[
              'Workspace -> Pages hierarchy',
              'Surfaces: Doc / Canvas / PDF attachments',
              'History: version snapshots + diffs',
              'Audit: who changed what, when',
              'Share link + roles (viewer/editor)',
            ]}
          />
        </Section>

        <Section
          id="collab"
          title="1.2 Real-time collaboration (Doc + Canvas)"
          description="Collaborative editing for docs and canvas with presence (who's online) and minimal cursors/selection. Conflict resolution via CRDT/OT."
        >
          <FeatureRow
            title="Presence + cursors, but quiet"
            description="Don't gamify it. Show small avatars, a subtle 'live' indicator, and optional cursors. Most users want calm, not fireworks."
            note="Implementation note: doc blocks + canvas objects can share the same collaboration layer."
            capabilities={[
              'Presence: active users list',
              'Optional cursors/selection',
              'CRDT/OT conflict resolution',
              'Offline merge-friendly writes',
            ]}
          />
        </Section>

        <Section
          id="pdf"
          title="1.3 Files and PDF"
          description="S3-compatible object storage, upload/download, PDF annotations (highlights + ink + comments), and extraction: highlights -> doc blocks."
        >
          <FeatureRow
            title="PDF as a first-class source"
            description="Make PDF annotation reliable: highlight ranges, freehand ink, and anchored comments. Then allow 'extract highlights' to instantly build a study doc page section."
            note="UX tip: one button Extract -> Doc creates structured blocks with citations."
            capabilities={[
              'Highlight (text ranges)',
              'Ink (stylus strokes)',
              'Comments (anchored)',
              'Export highlights -> doc blocks',
            ]}
          />
        </Section>

        <Section
          id="export"
          title="1.4 Export / send results"
          description="Export Page -> PDF and DOCX (server-side job). For B2C: 'Send to Notion' - create a page with content/attachment."
        >
          <FeatureRow
            title="Exports as background jobs"
            description="Generate PDF/DOCX server-side to keep the client clean. Provide a single 'Export' entry point on the page with format choices."
            note="B2C bridge: Send to Notion creates a page + attaches exported file."
            capabilities={[
              'Export PDF (print-ready)',
              'Export DOCX (editable)',
              'Job status + download link',
              'Send to Notion (page + file)',
            ]}
          />
        </Section>

        <Section
          id="tasks"
          title="1.5 Tasks + Calendar (minimum)"
          description="Tasks: title, due, status, links to pages. Calendar: events. In B2B: sync schedules/exams/deadlines from LMS."
        >
          <FeatureRow
            title="Tasks and time: the 'anti-procrastination' layer"
            description="The simplest implementation wins: tasks live next to pages and can create calendar events. B2B integration can come later via LMS sync."
            note="Keep schema tight: task -> page_id, event -> task_id?"
            capabilities={[
              'Task: title, due, status, page links',
              'Calendar: events + reminders',
              'B2B: LMS sync (deadlines/exams)',
            ]}
          />

          <div className="mt-[18px] rounded-[26px] border border-[rgba(20,20,20,0.07)] bg-gradient-to-b from-[rgba(255,255,255,0.86)] to-[rgba(255,255,255,0.70)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] p-5 flex items-center justify-between gap-3.5 flex-wrap">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Want it even closer to Notion's polish?</h3>
              <p className="mt-1.5 text-[#5b6167] text-[13.5px] leading-[1.6] max-w-[70ch]">
                I can add a super subtle "page cover + icon" header style, a database-table preview, and micro-interactions (hover/scroll reveal) without turning it into a neon dashboard.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)]">
                  Start building
                </Button>
              </Link>
              <Link href="#top">
                <Button variant="ghost" size="lg" className="h-12 px-6 text-[13px] font-bold rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.90)] hover:border-[rgba(20,20,20,0.14)]">
                  Back to top
                </Button>
              </Link>
            </div>
          </div>
        </Section>

        {/* Documentation & Resources Section */}
        <Section
          id="docs"
          title="Documentation & Resources"
          description="Everything you need to get started with EYWA. Explore our guides, API documentation, and community resources."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Getting Started Guide */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">Getting Started</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Quick start guide to set up EYWA, create your first workspace, and understand the core concepts.
              </p>
              <Link href="#core" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                Read guide
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* API Documentation */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">API Documentation</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Comprehensive API reference for integrating EYWA into your applications. RESTful endpoints and WebSocket support.
              </p>
              <a href={`${API_URL}/api/docs`} target="_blank" rel="noopener noreferrer" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                View API docs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Architecture Guide */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">Architecture Overview</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Learn about EYWA's microservices design, tech stack, and how different components work together.
              </p>
              <a href="https://github.com/expusercatherine/eywa-platform#-architecture" target="_blank" rel="noopener noreferrer" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                Explore architecture
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* User Guide */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">User Guide</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Detailed tutorials on using EYWA features: docs, canvas, PDF annotations, tasks, and collaboration tools.
              </p>
              <Link href="#core" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                Browse tutorials
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Security & Privacy */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">Security & Privacy</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Learn about our security practices, data encryption, GDPR compliance, and how we protect your academic work.
              </p>
              <Link href="#security" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                Security info
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Community */}
            <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-5 hover:shadow-[0_14px_32px_rgba(20,20,20,0.10)] transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1f7a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold tracking-tight mb-2">Community & Support</h3>
              <p className="text-[#5b6167] text-[13px] leading-[1.7] mb-3">
                Join our community of students and educators. Get help, share ideas, and contribute to the project.
              </p>
              <a href="https://github.com/expusercatherine/eywa-platform/issues" target="_blank" rel="noopener noreferrer" className="text-[#1f7a4a] text-[13px] font-semibold hover:underline inline-flex items-center gap-1">
                Join community
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="py-[34px] pb-[50px] border-t border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.35)] mt-20">
          <div className="max-w-[1140px] mx-auto px-6">
            <div className="flex items-start justify-between gap-[18px] flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#141414]">
                  <EywaIcon size={34} className="shadow-[0_10px_20px_rgba(31,122,74,0.12)]" />
                  <span>EYWA</span>
                </div>
                <p className="mt-2 text-[#5b6167] text-[13px] max-w-[60ch]">
                  Calm UI, strong model: workspace › pages › surfaces. Versioned, shareable, collaborative - designed for academic flow.
                </p>
                
                {/* Contact Information */}
                <div className="mt-4 space-y-2">
                  <h4 className="text-[13px] font-bold text-[#141414] tracking-tight">Contact Our Team</h4>
                  <div className="flex flex-col gap-1.5 text-[12px] text-[#5b6167]">
                    <a href="mailto:team@eywa.app" className="hover:text-[#1f7a4a] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      team@eywa.app
                    </a>
                    <a href="https://github.com/expusercatherine/eywa-platform" target="_blank" rel="noopener noreferrer" className="hover:text-[#1f7a4a] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      GitHub Repository
                    </a>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Hong Kong Polytechnic University</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 flex-wrap">
                <Link href="#core" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
                  Core
                </Link>
                <Link href="#collab" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
                  Collab
                </Link>
                <Link href="#pdf" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
                  PDF
                </Link>
                <Link href="#export" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
                  Export
                </Link>
                <Link href="#tasks" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
                  Tasks
                </Link>
                <Link href="/auth/login" className="px-2.5 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-[12px] font-semibold hover:border-[rgba(20,20,20,0.14)] hover:text-[#141414]">
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

// Section component
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-[60px]">
      <div className="max-w-[1140px] mx-auto px-6">
        <h2 className="text-[clamp(24px,3vw,40px)] font-bold tracking-[-0.04em] leading-[1.1] text-[#141414]">
          {title}
        </h2>
        <p className="mt-3 text-[#5b6167] text-[15px] leading-[1.75] max-w-[72ch]">
          {description}
        </p>
        <div className="mt-[22px] grid grid-cols-1 gap-3">
          {children}
        </div>
      </div>
    </section>
  );
}

// FeatureRow component
function FeatureRow({
  title,
  description,
  note,
  capabilities,
}: {
  title: string;
  description: string;
  note?: string;
  capabilities: string[];
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_28px_rgba(20,20,20,0.06)] p-[18px] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-[18px] items-start">
      <div>
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-[#5b6167] text-[13.5px] leading-[1.7]">{description}</p>
        {note && (
          <p className="mt-2.5 text-[#7a828a] text-[13.5px]">
            {note.split(/(`[^`]+`)/g).map((part, i) =>
              part.startsWith('`') && part.endsWith('`') ? (
                <kbd key={i} className="font-mono text-[11px] px-1.5 py-0.5 rounded-lg border border-[rgba(20,20,20,0.12)] bg-[rgba(255,255,255,0.9)] text-[rgba(20,20,20,0.78)]">
                  {part.slice(1, -1)}
                </kbd>
              ) : (
                part
              )
            )}
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.86)] p-3.5">
        <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-[rgba(20,20,20,0.55)] mb-2.5">
          Capabilities
        </div>
        <ul className="space-y-1.5 text-[#5b6167] text-[13px] leading-[1.7] list-disc pl-[18px]">
          {capabilities.map((cap, i) => (
            <li key={i}>{cap}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
