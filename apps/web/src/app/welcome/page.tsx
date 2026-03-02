'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Globe, Laptop, ArrowRight, Check, Zap, Shield, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { NotaIcon } from '@/components/NotaIcon';
import { APP_CONFIG } from '@/lib/app-config';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux' | 'unknown'>('unknown');

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      setPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setPlatform('mac');
    } else if (userAgent.includes('linux')) {
      setPlatform('linux');
    }
  }, [isAuthenticated, router]);

  const getDownloadUrl = () => {
    switch (platform) {
      case 'windows':
        return APP_CONFIG.DOWNLOADS.WINDOWS;
      case 'mac':
        return APP_CONFIG.DOWNLOADS.MAC;
      case 'linux':
        return APP_CONFIG.DOWNLOADS.LINUX;
      default:
        return APP_CONFIG.DOWNLOADS.WINDOWS;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'windows':
        return APP_CONFIG.PLATFORM_NAMES.WINDOWS;
      case 'mac':
        return APP_CONFIG.PLATFORM_NAMES.MAC;
      case 'linux':
        return APP_CONFIG.PLATFORM_NAMES.LINUX;
      default:
        return 'Your Platform';
    }
  };

  const desktopFeatures = [
    { icon: Zap, label: 'Faster Performance', description: 'Native desktop performance with instant loading' },
    { icon: Shield, label: 'Enhanced Security', description: 'Sandboxed environment with local data encryption' },
    { icon: Cloud, label: 'Offline Support', description: 'Work without internet, sync when connected' },
    { icon: Check, label: 'Auto Updates', description: 'Always get the latest features automatically' },
  ];

  const browserFeatures = [
    { icon: Globe, label: 'Access Anywhere', description: 'Use from any device with a web browser' },
    { icon: Check, label: 'No Installation', description: 'Start working immediately, no downloads needed' },
    { icon: Cloud, label: 'Always Updated', description: 'Always on the latest version automatically' },
    { icon: Shield, label: 'Secure Connection', description: 'End-to-end encrypted data transmission' },
  ];

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
            <div className="flex items-center gap-2.5 font-extrabold tracking-tight text-[#141414]">
              <NotaIcon size={34} className="shadow-[0_10px_20px_rgba(31,122,74,0.12)]" />
              <span className="text-base">Nota</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#5b6167] hidden sm:inline">Welcome, {user?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-4 py-12">
        <div className="max-w-[1140px] mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(20,20,20,0.07)] bg-[rgba(255,255,255,0.70)] text-[#5b6167] text-sm font-bold mb-6">
              <div className="w-2 h-2 rounded-full bg-[#21a061] shadow-[0_0_0_4px_rgba(31,122,74,0.10)]" />
              Account Created Successfully
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-[#141414] mb-4">
              Choose Your Experience
            </h1>
            <p className="text-lg text-[#5b6167] max-w-2xl mx-auto">
              Get the most out of Nota with our native desktop app, or start working immediately in your browser.
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Desktop App Option */}
            <Card className="relative overflow-hidden border-[rgba(20,20,20,0.10)] bg-[rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] hover:shadow-[0_20px_50px_rgba(20,20,20,0.12)] transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(31,122,74,0.08)] to-transparent" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#1f7a4a] to-[rgba(31,122,74,0.85)] shadow-[0_10px_20px_rgba(31,122,74,0.20)]">
                    <Laptop className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[rgba(31,122,74,0.10)] text-[#1f7a4a] text-xs font-bold">
                    RECOMMENDED
                  </div>
                </div>
                <CardTitle className="text-2xl">Desktop Application</CardTitle>
                <CardDescription className="text-base">
                  Download Nota for {getPlatformName()} and experience the full power of native performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {desktopFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 rounded-lg bg-[rgba(31,122,74,0.10)]">
                        <feature.icon className="w-4 h-4 text-[#1f7a4a]" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#141414]">{feature.label}</div>
                        <div className="text-xs text-[#5b6167]">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <a href={getDownloadUrl()} target="_blank" rel="noopener noreferrer">
                  <Button 
                    className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-b from-[#1f7a4a] to-[rgba(31,122,74,0.92)] border border-[rgba(31,122,74,0.45)] text-white shadow-[0_16px_34px_rgba(31,122,74,0.18)] hover:from-[#1f7a4a] hover:to-[rgba(31,122,74,0.86)] hover:border-[rgba(31,122,74,0.55)] transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download for {getPlatformName()}
                  </Button>
                </a>
                <p className="text-xs text-center text-[#7a828a]">
                  Free • Version {APP_CONFIG.APP_VERSION} • {APP_CONFIG.APP_SIZE_MB}
                </p>
              </CardContent>
            </Card>

            {/* Browser Version Option */}
            <Card className="relative overflow-hidden border-[rgba(20,20,20,0.10)] bg-[rgba(255,255,255,0.92)] shadow-[0_14px_40px_rgba(20,20,20,0.08)] hover:shadow-[0_20px_50px_rgba(20,20,20,0.12)] transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(31,122,74,0.05)] to-transparent" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-[rgba(31,122,74,0.12)] border border-[rgba(20,20,20,0.08)]">
                    <Globe className="w-6 h-6 text-[#1f7a4a]" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Browser Version</CardTitle>
                <CardDescription className="text-base">
                  Continue in your browser and start working on your projects right away.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {browserFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 rounded-lg bg-[rgba(31,122,74,0.08)]">
                        <feature.icon className="w-4 h-4 text-[#1f7a4a]" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#141414]">{feature.label}</div>
                        <div className="text-xs text-[#5b6167]">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard">
                  <Button 
                    variant="outline"
                    className="w-full h-12 text-sm font-bold rounded-xl border-[rgba(20,20,20,0.15)] bg-white hover:bg-[rgba(255,255,255,0.92)] hover:border-[rgba(20,20,20,0.20)] shadow-[0_10px_26px_rgba(20,20,20,0.06)] transition-all"
                  >
                    Continue in Browser
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-[#7a828a]">
                  Works in Chrome, Firefox, Safari, and Edge
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <Card className="border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.85)]">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[#1f7a4a] mb-2">100%</div>
                <p className="text-sm text-[#5b6167]">Feature Parity</p>
              </CardContent>
            </Card>
            <Card className="border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.85)]">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[#1f7a4a] mb-2">Free</div>
                <p className="text-sm text-[#5b6167]">Both Versions</p>
              </CardContent>
            </Card>
            <Card className="border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.85)]">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-[#1f7a4a] mb-2">Sync</div>
                <p className="text-sm text-[#5b6167]">Across All Devices</p>
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-sm text-[#7a828a]">
              You can always download the desktop app later from your account settings.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
