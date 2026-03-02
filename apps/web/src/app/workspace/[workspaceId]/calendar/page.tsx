'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Pencil, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { calendarApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  color: string | null;
  meetingUrl: string | null;
}

function startEndOfMonth(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function WorkspaceCalendarPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMeetingUrl, setFormMeetingUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    const { startDate, endDate } = startEndOfMonth(currentMonth);
    try {
      const data = await calendarApi.list(token, workspaceId, startDate, endDate);
      setEvents(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load events', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [token, workspaceId, currentMonth, toast]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadEvents();
  }, [workspaceId, currentMonth, isAuthenticated, router, loadEvents]);

  const openCreate = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 16);
    setFormTitle('');
    setFormStart(today);
    setFormEnd(today);
    setFormDescription('');
    setFormMeetingUrl('');
    setShowModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditingId(e.id);
    setFormTitle(e.title);
    setFormStart(e.startTime.slice(0, 16));
    setFormEnd(e.endTime.slice(0, 16));
    setFormDescription(e.description ?? '');
    setFormMeetingUrl(e.meetingUrl ?? '');
    setShowModal(true);
  };

  const saveEvent = async () => {
    if (!token || !formTitle.trim()) return;
    setIsSaving(true);
    try {
      const meetingUrl = formMeetingUrl.trim() || undefined;
      if (editingId) {
        await calendarApi.update(token, editingId, {
          title: formTitle.trim(),
          startTime: new Date(formStart).toISOString(),
          endTime: new Date(formEnd).toISOString(),
          description: formDescription.trim() || undefined,
          meetingUrl: meetingUrl ?? null,
        });
        toast({ title: 'Event updated' });
      } else {
        await calendarApi.create(token, {
          workspaceId,
          title: formTitle.trim(),
          startTime: new Date(formStart).toISOString(),
          endTime: new Date(formEnd).toISOString(),
          description: formDescription.trim() || undefined,
          meetingUrl,
        });
        toast({ title: 'Event created' });
      }
      setShowModal(false);
      loadEvents();
    } catch {
      toast({ title: 'Error', description: 'Failed to save event', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !eventToDelete) return;
    setIsDeleting(true);
    try {
      await calendarApi.delete(token, eventToDelete.id);
      toast({ title: 'Event deleted' });
      setEventToDelete(null);
      loadEvents();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1));

  if (!isAuthenticated()) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${workspaceId}`} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Calendar</h1>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </header>

      <main className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[180px] text-center">{monthLabel}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No events this month.</p>
          ) : (
            events.map((ev) => (
              <Card key={ev.id} className="group">
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(ev.startTime).toLocaleString()} – {new Date(ev.endTime).toLocaleString()}
                    </p>
                    {ev.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ev.description}</p>
                    )}
                    {ev.meetingUrl && (
                      <a
                        href={ev.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join meeting
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(ev)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setEventToDelete(ev)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {showModal && (() => {
        let submitLabel = 'Create';
        if (isSaving) submitLabel = 'Saving...';
        else if (editingId) submitLabel = 'Update';
        return (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowModal(false); }}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setShowModal(false); }}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">{editingId ? 'Edit Event' : 'New Event'}</h3>
              <Input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="event-start" className="text-xs text-muted-foreground">Start</label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="mt-0.5"
                  />
                </div>
                <div>
                  <label htmlFor="event-end" className="text-xs text-muted-foreground">End</label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="mt-0.5"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="event-desc" className="text-xs text-muted-foreground">Description (optional)</label>
                <Input
                  id="event-desc"
                  placeholder="Description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-0.5"
                />
              </div>
              <div>
                <label htmlFor="event-meeting" className="text-xs text-muted-foreground">Meeting link (Zoom, Meet, Outlook)</label>
                <Input
                  id="event-meeting"
                  type="url"
                  placeholder="https://zoom.us/j/... or Outlook/Teams link"
                  value={formMeetingUrl}
                  onChange={(e) => setFormMeetingUrl(e.target.value)}
                  className="mt-0.5"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={saveEvent} disabled={!formTitle.trim() || isSaving}>
                  {submitLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        );
      })()}

      {eventToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setEventToDelete(null); }}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setEventToDelete(null); }}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Delete event?</h3>
              <p className="text-sm text-muted-foreground">&quot;{eventToDelete.title}&quot; will be deleted.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEventToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
