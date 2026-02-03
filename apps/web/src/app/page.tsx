import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            <span className="text-xl font-bold">EYWA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            One Platform.{' '}
            <span className="text-primary">Zero Friction.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            EYWA is a unified academic ecosystem for university students and faculty,
            combining notes, PDF annotations, interactive whiteboards, tasks, and calendar
            in one intelligent platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-12 px-8">
                Start Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📝"
            title="Smart Documents"
            description="Collaborative document editing with version history and real-time sync."
          />
          <FeatureCard
            icon="🎨"
            title="Interactive Canvas"
            description="Whiteboard-style workspace like Miro for visual thinking and brainstorming."
          />
          <FeatureCard
            icon="📄"
            title="PDF Sources"
            description="Upload, annotate, and extract highlights from PDF materials."
          />
          <FeatureCard
            icon="✅"
            title="Task Management"
            description="Track assignments, deadlines, and milestones linked to your pages."
          />
          <FeatureCard
            icon="📅"
            title="Calendar"
            description="Schedule events and sync with your academic calendar."
          />
          <FeatureCard
            icon="🤖"
            title="AI Study Assistant"
            description="Generate summaries, flashcards, and get intelligent help with studying."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            © 2024 EYWA Platform. Developed by PolyU students.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
