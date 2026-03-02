import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { QuickLinksPreferences, LocalePreference } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuickLinks(userId: string): Promise<QuickLinksPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const prefs = user?.preferences as { quickLinks?: QuickLinksPreferences } | null;
    return prefs?.quickLinks ?? {};
  }

  async updateQuickLinks(userId: string, quickLinks: QuickLinksPreferences): Promise<QuickLinksPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const existing = (user?.preferences as Record<string, unknown> | null) ?? {};
    const merged = { ...existing, quickLinks };
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged },
    });
    return quickLinks;
  }

  async getLocale(userId: string): Promise<LocalePreference> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const prefs = user?.preferences as { locale?: string } | null;
    const raw = prefs?.locale ?? 'en';
    const locale = raw === 'zh' ? 'zh' : 'en';
    return { locale };
  }

  async updateLocale(userId: string, locale: 'en' | 'zh'): Promise<LocalePreference> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const existing = (user?.preferences as Record<string, unknown> | null) ?? {};
    const merged = { ...existing, locale };
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged },
    });
    return { locale };
  }
}
