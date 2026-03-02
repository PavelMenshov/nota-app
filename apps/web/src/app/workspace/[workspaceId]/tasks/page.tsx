'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  CheckSquare,
  Circle,
  CheckCircle2,
  Trash2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { tasksApi, workspacesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToAll?: boolean;
  creator: { id: string; name: string | null };
  page: { id: string; title: string } | null;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function WorkspaceTasksPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const { t } = useLocale();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [isCreating, setIsCreating] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [assignToAll, setAssignToAll] = useState(false);

  const loadWorkspaceRole = useCallback(async () => {
    if (!token || !workspaceId) return;
    try {
      const w = await workspacesApi.get(token, workspaceId);
      const me = w.members?.find((m) => m.user.id === user?.id);
      setMyRole(me?.role ?? null);
    } catch {
      setMyRole(null);
    }
  }, [token, workspaceId, user?.id]);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    try {
      const data = await tasksApi.list(token, workspaceId);
      const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      setTasks(
        [...data].sort(
          (a, b) => (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2)
        )
      );
    } catch {
      toast({ title: 'Error', description: 'Failed to load tasks', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [token, workspaceId, toast]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadTasks();
    loadWorkspaceRole();
  }, [workspaceId, isAuthenticated, router, loadTasks, loadWorkspaceRole]);

  const handleCreateTask = async () => {
    if (!token || !newTaskTitle.trim()) return;
    setIsCreating(true);
    try {
      await tasksApi.create(token, {
        workspaceId,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        assignedToAll: (myRole === 'OWNER' || myRole === 'PROFESSOR') && assignToAll ? true : undefined,
      });
      toast({ title: 'Task created!' });
      setShowCreateModal(false);
      setNewTaskTitle('');
      setNewTaskPriority('MEDIUM');
      setAssignToAll(false);
      loadTasks();
    } catch {
      toast({ title: 'Error', description: 'Failed to create task', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!token) return;
    try {
      await tasksApi.update(token, taskId, { status: newStatus });
      loadTasks();
    } catch {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const confirmDeleteTask = async () => {
    if (!token || !taskToDelete) return;
    setIsDeleting(true);
    try {
      await tasksApi.delete(token, taskToDelete.id);
      toast({ title: 'Task deleted' });
      setTaskToDelete(null);
      loadTasks();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const grouped = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

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
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground" title="Back to workspaces">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <h1 className="text-lg font-semibold">{t('tasks.title')}</h1>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('tasks.newTask')}
          </Button>
        </div>
      </header>

      <main className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Circle className="h-4 w-4" />
              {t('tasks.toDo')} ({grouped.TODO.length})
            </h3>
            <div className="space-y-2">
              {grouped.TODO.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={setTaskToDelete}
                />
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-4">{t('tasks.inProgress')} ({grouped.IN_PROGRESS.length})</h3>
            <div className="space-y-2">
              {grouped.IN_PROGRESS.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={setTaskToDelete}
                />
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {t('tasks.done')} ({grouped.DONE.length})
            </h3>
            <div className="space-y-2">
              {grouped.DONE.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={setTaskToDelete}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateModal(false); }}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateModal(false); }}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">{t('tasks.createTask')}</h3>
              <Input
                placeholder={t('tasks.taskTitle')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                autoFocus
              />
              {(myRole === 'OWNER' || myRole === 'PROFESSOR') && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assignToAll}
                    onChange={(e) => setAssignToAll(e.target.checked)}
                    className="rounded border-input"
                  />
                  Assign to all course members
                </label>
              )}
              <div className="flex gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={newTaskPriority === p ? 'default' : 'outline'}
                    onClick={() => setNewTaskPriority(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  {t('tasks.cancel')}
                </Button>
                <Button className="flex-1" onClick={handleCreateTask} disabled={!newTaskTitle.trim() || isCreating}>
                  {isCreating ? t('tasks.creating') : t('tasks.create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {taskToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setTaskToDelete(null);
            if (e.key === 'Enter') { e.preventDefault(); confirmDeleteTask(); }
          }}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setTaskToDelete(null); if (e.key === 'Enter') { e.preventDefault(); confirmDeleteTask(); } }}>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">{t('tasks.deleteConfirm')}</h3>
              <p className="text-sm text-muted-foreground">{t('tasks.deleteConfirmMessage', { title: taskToDelete.title })}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setTaskToDelete(null)}>
                  {t('tasks.cancel')}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={confirmDeleteTask} disabled={isDeleting}>
                  {isDeleting ? t('common.saving') : t('common.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (task: Task) => void;
}) {
  let nextStatus = 'TODO';
  if (task.status === 'TODO') nextStatus = 'IN_PROGRESS';
  else if (task.status === 'IN_PROGRESS') nextStatus = 'DONE';
  return (
    <Card className="group">
      <CardContent className="p-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{task.title}</p>
          {task.assignedToAll && (
            <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary mt-0.5">Course deadline</span>
          )}
          {task.page && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" />
              {task.page.title}
            </p>
          )}
          {task.dueDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('tasks.due')}: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {task.priority}
          </span>
          {task.status !== 'DONE' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => onStatusChange(task.id, nextStatus)}
            >
              → {nextStatus === 'DONE' ? t('tasks.done') : t('tasks.next')}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(task)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
