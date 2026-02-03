import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePageDto, UpdatePageDto } from './dto/pages.dto';
import { Prisma } from '@eywa/database';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePageDto) {
    // Check workspace access
    await this.checkWorkspaceAccess(dto.workspaceId, userId, ['OWNER', 'EDITOR']);

    // Get max order
    const maxOrder = await this.prisma.page.aggregate({
      where: {
        workspaceId: dto.workspaceId,
        parentId: dto.parentId || null,
      },
      _max: { order: true },
    });

    const page = await this.prisma.page.create({
      data: {
        workspaceId: dto.workspaceId,
        title: dto.title,
        parentId: dto.parentId,
        order: (maxOrder._max.order || 0) + 1,
        // Create empty doc and canvas
        doc: {
          create: {
            content: { type: 'doc', content: [] },
            plainText: '',
          },
        },
        canvas: {
          create: {
            content: { elements: [], viewport: { x: 0, y: 0, zoom: 1 } },
          },
        },
      },
      include: {
        doc: true,
        canvas: true,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId: page.id,
        userId,
        action: 'created',
        details: { title: dto.title },
      },
    });

    return page;
  }

  async findAllByWorkspace(workspaceId: string, userId: string) {
    await this.checkWorkspaceAccess(workspaceId, userId);

    return this.prisma.page.findMany({
      where: { workspaceId },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
        doc: true,
        canvas: true,
        sources: true,
        children: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check access
    const hasAccess = page.workspace.members.some((m) => m.userId === userId);
    if (!hasAccess) {
      // Check share link
      if (!page.shareLinkEnabled) {
        throw new ForbiddenException('Access denied');
      }
    }

    return page;
  }

  async update(id: string, userId: string, dto: UpdatePageDto) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.checkWorkspaceAccess(page.workspaceId, userId, ['OWNER', 'EDITOR']);

    const updated = await this.prisma.page.update({
      where: { id },
      data: dto,
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId: id,
        userId,
        action: 'updated',
        details: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.checkWorkspaceAccess(page.workspaceId, userId, ['OWNER', 'EDITOR']);

    await this.prisma.page.delete({
      where: { id },
    });

    return { success: true };
  }

  async search(workspaceId: string, userId: string, query: string) {
    await this.checkWorkspaceAccess(workspaceId, userId);

    return this.prisma.page.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { doc: { plainText: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        doc: {
          select: {
            plainText: true,
          },
        },
      },
      take: 20,
    });
  }

  async generateShareLink(pageId: string, userId: string, role: 'EDITOR' | 'VIEWER' = 'VIEWER') {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.checkWorkspaceAccess(page.workspaceId, userId, ['OWNER']);

    const shareLink = uuidv4();

    return this.prisma.page.update({
      where: { id: pageId },
      data: {
        shareLink,
        shareLinkEnabled: true,
        shareRole: role,
      },
      select: {
        shareLink: true,
        shareLinkEnabled: true,
        shareRole: true,
      },
    });
  }

  async getActivity(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.checkWorkspaceAccess(page.workspaceId, userId);

    return this.prisma.activity.findMany({
      where: { pageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async checkWorkspaceAccess(workspaceId: string, userId: string, allowedRoles?: string[]) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles && !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}
