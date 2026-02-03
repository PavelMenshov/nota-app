import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface UserPresence {
  oderId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  cursor?: { x: number; y: number };
  selection?: unknown;
  lastActivity: Date;
}

@Injectable()
export class RealtimeService {
  private pagePresence: Map<string, Map<string, UserPresence>> = new Map();

  constructor(private prisma: PrismaService) {}

  async verifyAccess(pageId: string, userId: string): Promise<boolean> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: { members: true },
        },
      },
    });

    if (!page) return false;

    return page.workspace.members.some((m) => m.userId === userId);
  }

  joinPage(pageId: string, userId: string, user: UserPresence) {
    if (!this.pagePresence.has(pageId)) {
      this.pagePresence.set(pageId, new Map());
    }
    this.pagePresence.get(pageId)!.set(userId, user);
  }

  leavePage(pageId: string, userId: string) {
    const pageUsers = this.pagePresence.get(pageId);
    if (pageUsers) {
      pageUsers.delete(userId);
      if (pageUsers.size === 0) {
        this.pagePresence.delete(pageId);
      }
    }
  }

  updatePresence(pageId: string, oderId: string, update: Partial<UserPresence>) {
    const pageUsers = this.pagePresence.get(pageId);
    if (pageUsers) {
      const user = pageUsers.get(oderId);
      if (user) {
        pageUsers.set(oderId, { ...user, ...update, lastActivity: new Date() });
      }
    }
  }

  getPagePresence(pageId: string): UserPresence[] {
    const pageUsers = this.pagePresence.get(pageId);
    if (!pageUsers) return [];
    return Array.from(pageUsers.values());
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
  }
}
