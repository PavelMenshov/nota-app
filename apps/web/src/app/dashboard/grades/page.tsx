'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, GraduationCap, RefreshCw, Megaphone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { lmsApi, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface LmsIntegration {
  id: string;
  provider: string;
  baseUrl: string;
  _count: { courses: number };
}

interface CourseGrades {
  id: string;
  name: string;
  code: string | null;
  term: string | null;
  grades: Array<{
    id: string;
    name: string;
    score: number | null;
    maxScore: number | null;
    letterGrade: string | null;
    feedback: string | null;
    syncedAt: string;
  }>;
}

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  course: { id: string; name: string; code: string | null } | null;
}

function formatScore(score: number | null, maxScore: number | null): string {
  if (score != null && maxScore != null) return `${score} / ${maxScore}`;
  if (score != null) return String(score);
  return '—';
}

function gradeRowColor(letterGrade: string | null): string {
  if (!letterGrade) return '';
  const g = letterGrade.toUpperCase().replace(/[+-]/, '');
  if (g === 'A') return 'bg-green-500/10 dark:bg-green-500/20';
  if (g === 'B') return 'bg-amber-500/10 dark:bg-amber-500/20';
  if (g === 'C') return 'bg-orange-500/10 dark:bg-orange-500/20';
  if (g === 'D' || g === 'F') return 'bg-red-500/10 dark:bg-red-500/20';
  return '';
}

function isImportantAnnouncement(title: string): boolean {
  const t = title.toLowerCase();
  return /important|urgent|!/.test(t) || t.startsWith('welcome');
}

export default function MyGradesPage() {
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<LmsIntegration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gradesByCourse, setGradesByCourse] = useState<CourseGrades[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [syncingGrades, setSyncingGrades] = useState<string | null>(null);
  const [syncingAnnouncements, setSyncingAnnouncements] = useState<string | null>(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const loadIntegrations = useCallback(async () => {
    if (!token) return;
    try {
      const list = await lmsApi.listIntegrations(token);
      setIntegrations(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].id);
    } catch {
      toast({ title: 'Could not load LMS connections', variant: 'destructive' });
    }
  }, [token, selectedId, toast]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const loadGrades = useCallback(async (integrationId: string) => {
    if (!token) return;
    setLoadingGrades(true);
    try {
      const data = await lmsApi.getGrades(token, integrationId);
      setGradesByCourse(data);
    } catch (e) {
      if (ApiError.is(e) && e.status === 404) setGradesByCourse([]);
      else toast({ title: 'Could not load grades', variant: 'destructive' });
    } finally {
      setLoadingGrades(false);
    }
  }, [token, toast]);

  const loadAnnouncements = useCallback(async (integrationId: string) => {
    if (!token) return;
    setLoadingAnnouncements(true);
    try {
      const data = await lmsApi.getAnnouncements(token, integrationId, 30);
      setAnnouncements(data);
    } catch (e) {
      if (ApiError.is(e) && e.status === 404) setAnnouncements([]);
      else toast({ title: 'Could not load announcements', variant: 'destructive' });
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (selectedId) {
      loadGrades(selectedId);
      loadAnnouncements(selectedId);
    } else {
      setGradesByCourse(null);
      setAnnouncements(null);
    }
  }, [selectedId, loadGrades, loadAnnouncements]);

  const handleSyncGrades = async (integrationId: string) => {
    if (!token) return;
    setSyncingGrades(integrationId);
    try {
      const result = await lmsApi.syncGrades(token, integrationId);
      toast({ title: `Grades synced: ${result.synced} columns`, description: result.message });
      loadGrades(integrationId);
    } catch (e) {
      toast({ title: 'Sync failed', description: ApiError.is(e) ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSyncingGrades(null);
    }
  };

  const handleSyncAnnouncements = async (integrationId: string) => {
    if (!token) return;
    setSyncingAnnouncements(integrationId);
    try {
      const result = await lmsApi.syncAnnouncements(token, integrationId);
      toast({ title: `Announcements synced: ${result.synced}`, description: result.message });
      loadAnnouncements(integrationId);
    } catch (e) {
      toast({ title: 'Sync failed', description: ApiError.is(e) ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSyncingAnnouncements(null);
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Log in to view your grades.</p>
      </div>
    );
  }

  const current = integrations.find((i) => i.id === selectedId);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              My grades & announcements
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
                View grades and course announcements from your LMS in one place.
            </p>
          </div>
        </div>

        {integrations.length === 0 ? (
          <Card className="rounded-lg border border-dashed border-border bg-card">
            <CardContent className="py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No LMS connected.</p>
              <Link href="/dashboard">
                <Button variant="link" className="mt-2 text-primary">Add one from the dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {integrations.map((int) => (
                <Button
                  key={int.id}
                  variant={selectedId === int.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedId(int.id)}
                >
                  {int.provider}
                </Button>
              ))}
            </div>

            {current && (
              <>
                <Card className="rounded-lg border border-border bg-card mb-6">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-lg">Grades</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncGrades(current.id)}
                        disabled={syncingGrades === current.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncingGrades === current.id ? 'animate-spin' : ''}`} />
                        {syncingGrades === current.id ? 'Syncing…' : `Sync from ${current.provider}`}
                      </Button>
                    </div>
                    <CardDescription>Grades from your courses. Sync to pull latest from Blackboard, Canvas, or Moodle.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingGrades && <p className="text-sm text-muted-foreground">Loading…</p>}
                    {!loadingGrades && (!gradesByCourse || gradesByCourse.length === 0) && (
                      <p className="text-sm text-muted-foreground">No grades yet. Click sync above to pull your grades from your LMS.</p>
                    )}
                    {!loadingGrades && gradesByCourse && gradesByCourse.length > 0 && (
                      <div className="space-y-6">
                        {gradesByCourse.map((course) => (
                          <div key={course.id}>
                            <h3 className="font-medium text-foreground mb-2">
                              {course.name}
                              {course.code && <span className="text-muted-foreground font-normal ml-2">({course.code})</span>}
                            </h3>
                            <div className="rounded-md border border-border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Item</th>
                                    <th className="text-right p-2 font-medium">Score</th>
                                    <th className="text-right p-2 font-medium">Letter</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {course.grades.map((g) => (
                                    <tr key={g.id} className={`border-t border-border ${gradeRowColor(g.letterGrade)}`}>
                                      <td className="p-2">{g.name}</td>
                                      <td className="p-2 text-right">
                                        {formatScore(g.score, g.maxScore)}
                                      </td>
                                      <td className="p-2 text-right font-medium">{g.letterGrade ?? '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Megaphone className="h-5 w-5" />
                        Announcements
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncAnnouncements(current.id)}
                        disabled={syncingAnnouncements === current.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncingAnnouncements === current.id ? 'animate-spin' : ''}`} />
                        {syncingAnnouncements === current.id ? 'Syncing…' : `Sync from ${current.provider}`}
                      </Button>
                    </div>
                    <CardDescription>Course announcements from your LMS.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAnnouncements && <p className="text-sm text-muted-foreground">Loading…</p>}
                    {!loadingAnnouncements && (!announcements || announcements.length === 0) && (
                      <p className="text-sm text-muted-foreground">No announcements yet. Click sync above to pull them from your LMS.</p>
                    )}
                    {!loadingAnnouncements && announcements && announcements.length > 0 && (
                      <ul className="space-y-4">
                        {announcements.map((a) => (
                          <li
                            key={a.id}
                            className={`border-b border-border pb-4 last:border-0 last:pb-0 rounded-md px-3 py-2 ${isImportantAnnouncement(a.title) ? 'bg-amber-200/50 dark:bg-amber-500/20 border border-amber-400/50 dark:border-amber-500/50' : ''}`}
                          >
                            <p className="font-medium text-foreground">{a.title}</p>
                            {a.course && (
                              <p className="text-xs text-muted-foreground mt-0.5">{a.course.name} {a.course.code && `(${a.course.code})`}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </p>
                            {a.body && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.body}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

