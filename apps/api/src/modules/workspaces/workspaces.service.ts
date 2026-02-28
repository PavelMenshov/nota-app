import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from './dto/workspaces.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async createDemo(userId: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: 'Demo Course (Pitch)',
        description: 'Sample academic workspace for demos and pitches. Contains pre-filled Syllabus, module overviews, and a canvas example — ideal for showing Nota to stakeholders.',
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    const emptyDoc = { type: 'doc' as const, content: [] };
    const emptyPlain = '';

    const docContent = (
      blocks: Array<{ type: 'paragraph' | 'heading'; level?: number; text: string }>,
    ) => {
      const content = blocks.map((b) =>
        b.type === 'heading'
          ? {
              type: 'heading' as const,
              attrs: { level: b.level ?? 2 },
              content: [{ type: 'text' as const, text: b.text }],
            }
          : {
              type: 'paragraph' as const,
              content: [{ type: 'text' as const, text: b.text }],
            },
      );
      return {
        json: { type: 'doc' as const, content },
        plainText: blocks.map((b) => b.text).join('\n\n'),
      };
    };

    const createPage = async (
      title: string,
      order: number,
      parentId?: string,
      doc?: { json: object; plainText: string },
      canvas?: { elements: object[]; viewport: { x: number; y: number; zoom: number } },
    ) => {
      return this.prisma.page.create({
        data: {
          workspaceId: workspace.id,
          title,
          order,
          parentId: parentId || null,
          doc: {
            create: {
              content: (doc?.json ?? emptyDoc) as object,
              plainText: doc?.plainText ?? emptyPlain,
            },
          },
          canvas: {
            create: {
              content: (canvas ?? { elements: [], viewport: { x: 0, y: 0, zoom: 1 } }) as object,
            },
          },
        },
        include: { doc: true, canvas: true },
      });
    };

    const syllabusDoc = docContent([
      { type: 'heading', level: 1, text: 'Course Syllabus' },
      { type: 'paragraph', text: 'Welcome to the demo course. This workspace shows how Nota brings notes, whiteboards, and PDFs together on a single page.' },
      { type: 'heading', level: 2, text: 'Learning objectives' },
      { type: 'paragraph', text: '• Understand the structure of a Nota workspace (Doc, Canvas, Sources).\n• Use the Canvas to brainstorm and map ideas.\n• Attach PDFs in Sources and extract highlights into your notes.' },
      { type: 'heading', level: 2, text: 'Schedule' },
      { type: 'paragraph', text: 'Module 1 — Introduction (Weeks 1–2). Module 2 — Assignments (see Assignment 1 and 2). Use the Tasks and Calendar tabs in the sidebar to track deadlines and events.' },
    ]);

    const module1Doc = docContent([
      { type: 'heading', level: 1, text: 'Module 1 — Introduction' },
      { type: 'paragraph', text: 'This module covers the basics. Open the Doc tab to edit this text, the Canvas tab to add sticky notes and shapes, and the Sources tab to upload PDFs.' },
      { type: 'paragraph', text: 'Tip: Use AI (Summary / Flashcards) from the toolbar to generate a summary or flashcard set from this page.' },
    ]);

    const week1Doc = docContent([
      { type: 'heading', level: 1, text: 'Week 1: Getting started' },
      { type: 'paragraph', text: 'First steps: create pages, add content in Doc, and try the Canvas board. Invite collaborators via the workspace share link.' },
    ]);

    const assignment1Doc = docContent([
      { type: 'heading', level: 1, text: 'Assignment 1' },
      { type: 'paragraph', text: 'Due: see Tasks. Submit your work as described in the course policy. Attach supporting PDFs in the Sources tab and reference them in your Doc.' },
    ]);

    const demoCanvasElements = [
      { id: 'demo-1', type: 'sticky-note', x: 80, y: 60, width: 160, height: 100, text: 'Ideas for the pitch', color: '#FEF08A', tag: 'demo' },
      { id: 'demo-2', type: 'sticky-note', x: 280, y: 80, width: 140, height: 80, text: 'Doc + Canvas + PDF', color: '#BBF7D0' },
      { id: 'demo-3', type: 'sticky-note', x: 460, y: 70, width: 150, height: 90, text: 'Collaboration & sharing', color: '#BFDBFE' },
    ];

    await createPage('Syllabus', 0, undefined, syllabusDoc);
    const module1 = await createPage('Module 1 — Introduction', 1, undefined, module1Doc);
    await createPage('Week 1: Getting started', 0, module1.id, week1Doc, {
      elements: demoCanvasElements,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    await createPage('Week 2: Core concepts', 1, module1.id);
    const module2 = await createPage('Module 2 — Assignments', 2);
    await createPage('Assignment 1', 0, module2.id, assignment1Doc);
    await createPage('Assignment 2', 1, module2.id);

    return this.prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        pages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const name = (dto.name ?? '').trim();
    if (!name) {
      throw new BadRequestException('Workspace name is required');
    }
    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: name.slice(0, 100),
          description: dto.description?.trim() || undefined,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
      return workspace;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: string }).code;
        if (code === 'P2002') {
          throw new BadRequestException('A workspace with this name may already exist or a constraint was violated.');
        }
        if (code === 'P2003') {
          throw new BadRequestException('Invalid user reference. Please sign in again.');
        }
      }
      throw new BadRequestException(
        'Failed to create workspace. Check that the database is running and migrations are applied.',
      );
    }
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            pages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        pages: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(id: string, userId: string, dto: UpdateWorkspaceDto) {
    await this.checkPermission(id, userId, ['OWNER', 'EDITOR']);

    return this.prisma.workspace.update({
      where: { id },
      data: dto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.checkPermission(id, userId, ['OWNER']);

    await this.prisma.workspace.delete({
      where: { id },
    });

    return { success: true };
  }

  async addMember(workspaceId: string, userId: string, dto: AddMemberDto) {
    await this.checkPermission(workspaceId, userId, ['OWNER']);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role || 'VIEWER',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeMember(workspaceId: string, memberId: string, userId: string) {
    await this.checkPermission(workspaceId, userId, ['OWNER']);

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }

  async updateMemberRole(workspaceId: string, memberId: string, userId: string, role: 'OWNER' | 'EDITOR' | 'VIEWER') {
    await this.checkPermission(workspaceId, userId, ['OWNER']);

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async generateShareLink(workspaceId: string, userId: string, role: 'EDITOR' | 'VIEWER' = 'VIEWER') {
    await this.checkPermission(workspaceId, userId, ['OWNER']);

    const shareLink = uuidv4();

    return this.prisma.workspace.update({
      where: { id: workspaceId },
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

  async linkLms(workspaceId: string, userId: string, integrationId: string) {
    await this.checkPermission(workspaceId, userId, ['OWNER', 'EDITOR']);
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { lmsIntegrationId: integrationId },
    });
    return { success: true, integrationId };
  }

  async joinByShareLink(shareLink: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { shareLink },
    });

    if (!workspace || !workspace.shareLinkEnabled) {
      throw new NotFoundException('Invalid or disabled share link');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId,
        },
      },
    });

    if (existingMember) {
      return workspace;
    }

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: workspace.shareRole,
      },
    });

    return workspace;
  }

  private async checkPermission(workspaceId: string, userId: string, allowedRoles: string[]) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return member;
  }
}
