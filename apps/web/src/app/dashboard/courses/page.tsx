'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';

export default function DashboardCoursesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
  }, [isAuthenticated, router]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          University / Courses
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect your learning management system and manage your courses.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <Card className="rounded-xl border border-border bg-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">View courses</CardTitle>
                <CardDescription>See your enrolled courses and assignments in one place.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Connect LMS</CardTitle>
                <CardDescription>
                  Link Canvas, Moodle, or another LMS to sync courses and deadlines.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              LMS integration can be configured on the dashboard. Add your institution&apos;s learning management system to import courses and assignments.
            </p>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/dashboard">Add LMS on dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
