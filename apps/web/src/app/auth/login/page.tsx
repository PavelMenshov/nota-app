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
import { NotaIcon } from '@/components/NotaIcon';
import { useLocale } from '@/contexts/LocaleContext';

type AuthProvider = 'google' | 'microsoft' | 'apple' | 'sso';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setAuth(response.accessToken, response.user);
      toast({ title: 'Welcome back!', description: `Logged in as ${response.user.email}` });
      router.push('/welcome');
    } catch (error) {
      let title = t('auth.loginFailed');
      let description = t('auth.invalidCredentials');
      if (error instanceof ApiError) {
        if (error.isNetworkError) {
          title = 'Connection error';
          description = error.message;
          if (error.helpText) description += '\n\n' + error.helpText;
        } else if (error.statusCode === 401) {
          description = t('auth.invalidCredentials');
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

  const handleProviderClick = (provider: AuthProvider) => {
    // When backend adds GET /api/auth/:provider (OAuth redirect), use: window.location.href = getProviderAuthUrl(provider);
    toast({ title: t('auth.comingSoon'), variant: 'default' });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline font-semibold tracking-tight">
            <NotaIcon size={32} className="shrink-0 rounded-lg" />
            Nota
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="sm" className="rounded-md h-9">
              {t('auth.register')}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="rounded-lg border border-border bg-card shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('auth.logIn')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('auth.logInSubtitle')}</p>
              </div>

              {/* Log in with email */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">{t('auth.withEmail')}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
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
                    <Label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</Label>
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
                    {isLoading ? t('auth.loggingIn') : t('auth.logIn')}
                  </Button>
                </form>
              </div>

              {/* Or continue with */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">{t('auth.continueWith')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-2 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/50 dark:hover:border-amber-700 transition-colors font-medium"
                  onClick={() => handleProviderClick('google')}
                >
                  {t('auth.withGoogle')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-2 bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 hover:border-sky-300 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200 dark:hover:bg-sky-900/50 dark:hover:border-sky-700 transition-colors font-medium"
                  onClick={() => handleProviderClick('microsoft')}
                >
                  {t('auth.withMicrosoft')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-2 bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200 hover:border-neutral-400 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:hover:border-neutral-500 transition-colors font-medium"
                  onClick={() => handleProviderClick('apple')}
                >
                  {t('auth.withApple')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg min-w-0 border-2 bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-900/50 dark:hover:border-indigo-700 transition-colors font-medium"
                  onClick={() => handleProviderClick('sso')}
                >
                  <span className="truncate min-w-0">{t('auth.withSSO')}</span>
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link href="/auth/register" className="font-medium text-primary hover:underline">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
