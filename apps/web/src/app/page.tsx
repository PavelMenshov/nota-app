'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
              <div className="w-[34px] h-[34px] rounded-[10px] border border-[rgba(20,20,20,0.10)] bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] shadow-[0_10px_20px_rgba(31,122,74,0.12)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(31,122,74,0.18)] to-transparent opacity-70 group-hover:animate-[sweep_3.8s_cubic-bezier(0.2,0.8,0.2,1)_infinite]" style={{ transform: 'translateX(-60%)' }} />
              </div>
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

        {/* Footer */}
        <footer className="py-[34px] pb-[50px] border-t border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.35)] mt-20">
          <div className="max-w-[1140px] mx-auto px-6">
            <div className="flex items-start justify-between gap-[18px] flex-wrap">
              <div>
                <div className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#141414]">
                  <div className="w-[34px] h-[34px] rounded-[10px] border border-[rgba(20,20,20,0.10)] bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] shadow-[0_10px_20px_rgba(31,122,74,0.12)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(31,122,74,0.18)] to-transparent opacity-70" />
                  </div>
                  <span>EYWA</span>
                </div>
                <p className="mt-2 text-[#5b6167] text-[13px] max-w-[60ch]">
                  Calm UI, strong model: workspace › pages › surfaces. Versioned, shareable, collaborative - designed for academic flow.
                </p>
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
