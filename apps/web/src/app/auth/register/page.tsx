'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
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
      const response = await authApi.register(email, password, name);
      setAuth(response.accessToken, response.user);
      toast({ title: 'Account created!', description: 'Welcome to EYWA Platform' });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#141414]">
              <div className="w-[34px] h-[34px] rounded-[10px] border border-[rgba(20,20,20,0.10)] bg-gradient-to-br from-[rgba(31,122,74,0.18)] to-[rgba(31,122,74,0.06)] shadow-[0_10px_20px_rgba(31,122,74,0.12)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(31,122,74,0.18)] to-transparent opacity-70 group-hover:animate-[sweep_3.8s_cubic-bezier(0.2,0.8,0.2,1)_infinite]" style={{ transform: 'translateX(-60%)' }} />
              </div>
              <span className="text-base">EYWA</span>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="h-10 px-3.5 text-[13px] font-bold rounded-full border border-[rgba(20,20,20,0.10)] bg-white hover:bg-[rgba(255,255,255,0.92)] hover:border-[rgba(20,20,20,0.16)] shadow-[0_10px_26px_rgba(20,20,20,0.06)] transition-all">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div className="rounded-[20px] border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] backdrop-blur-[10px] p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#141414]">Create your account</h1>
                <p className="text-[14px] text-[#5b6167]">Get started with EYWA in seconds</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-bold text-[#141414]">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-xl border-[rgba(20,20,20,0.10)] bg-white focus:border-[#1f7a4a] focus:ring-[rgba(31,122,74,0.12)] text-[14px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-bold text-[#141414]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl border-[rgba(20,20,20,0.10)] bg-white focus:border-[#1f7a4a] focus:ring-[rgba(31,122,74,0.12)] text-[14px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[13px] font-bold text-[#141414]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 rounded-xl border-[rgba(20,20,20,0.10)] bg-white focus:border-[#1f7a4a] focus:ring-[rgba(31,122,74,0.12)] text-[14px]"
                  />
                  <p className="text-[12px] text-[#5b6167]">Must be at least 8 characters</p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 text-[13px] font-bold rounded-full bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)] hover:from-[#1f7a4a] hover:to-[rgba(31,122,74,0.86)] hover:border-[rgba(31,122,74,0.55)] transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              {/* Footer */}
              <div className="text-center">
                <p className="text-[13px] text-[#5b6167]">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-bold text-[#1f7a4a] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
