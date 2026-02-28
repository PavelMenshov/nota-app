'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { authApi, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setAuth(response.accessToken, response.user);
      toast({ title: 'Welcome back!', description: `Logged in as ${response.user.email}` });
      router.push('/welcome');
    } catch (error) {
      let title = 'Login failed';
      let description = 'Invalid credentials';
      if (error instanceof ApiError) {
        if (error.isNetworkError) {
          title = 'Connection error';
          description = error.message;
          if (error.helpText) description += '\n\n' + error.helpText;
        } else if (error.statusCode === 401) {
          description = 'Invalid email or password. Please try again.';
        } else {
          description = error.message;
        }
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline font-semibold tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            Nota
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="sm" className="rounded-md h-9">
              Create account
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-lg border border-border bg-card shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access your workspaces.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 rounded-md"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-md bg-primary hover:bg-primary/90">
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
