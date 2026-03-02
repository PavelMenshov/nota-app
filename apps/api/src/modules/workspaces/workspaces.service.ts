import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CreateWorkspaceInput } from '@nota/shared';
import { UpdateWorkspaceDto, AddMemberDto } from './dto/workspaces.dto';
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
    const workspacePath = `/workspace/${workspace.id}`;

    type DocBlock =
      | { type: 'paragraph' | 'heading'; level?: number; text: string; href?: string }
      | { type: 'paragraph'; text: string; href: string };

    const docContent = (blocks: DocBlock[]) => {
      const content = blocks.map((b) => {
        if (b.type === 'heading') {
          return {
            type: 'heading' as const,
            attrs: { level: (b as { level?: number }).level ?? 2 },
            content: [{ type: 'text' as const, text: b.text }],
          };
        }
        const textNode =
          'href' in b && b.href
            ? { type: 'text' as const, text: b.text, marks: [{ type: 'link' as const, attrs: { href: b.href } }] }
            : { type: 'text' as const, text: b.text };
        return { type: 'paragraph' as const, content: [textNode] };
      });
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
      { type: 'paragraph', text: 'Module 1 — Introduction (Weeks 1–2). Module 2 — Assignments. Use the Tasks and Calendar tabs in the sidebar to track deadlines and events.' },
      { type: 'paragraph', text: '→ Module 1 — Introduction', href: workspacePath },
      { type: 'paragraph', text: '→ Module 2 — Assignments', href: workspacePath },
    ]);

    const module1Doc = docContent([
      { type: 'heading', level: 1, text: 'Module 1 — Introduction' },
      { type: 'paragraph', text: 'This module covers the basics. Open the Doc tab to edit this text, the Canvas tab to add sticky notes and shapes, and the Sources tab to upload PDFs.' },
      { type: 'paragraph', text: 'Tip: Use AI (Summary / Flashcards) from the toolbar to generate a summary or flashcard set from this page.' },
      { type: 'paragraph', text: '→ Syllabus', href: workspacePath },
      { type: 'paragraph', text: '→ Week 1: Getting started', href: workspacePath },
      { type: 'paragraph', text: '→ Week 2: Core concepts', href: workspacePath },
    ]);

    const week1Doc = docContent([
      { type: 'heading', level: 1, text: 'Week 1: Getting started' },
      { type: 'paragraph', text: 'First steps: create pages, add content in Doc, and try the Canvas board. Invite collaborators via the workspace share link.' },
      { type: 'paragraph', text: '→ Module 1 — Introduction', href: workspacePath },
      { type: 'paragraph', text: '→ Week 2: Core concepts', href: workspacePath },
    ]);

    const week2Doc = docContent([
      { type: 'heading', level: 1, text: 'Week 2: Core concepts' },
      { type: 'paragraph', text: 'This week we go deeper: connect ideas on the Canvas with connectors, add shapes and text blocks, and use Canvas → Outline to turn board content into a Doc structure.' },
      { type: 'paragraph', text: 'Export your page to PDF or DOCX from the dashboard or export menu. Link tasks and calendar events to this page for deadlines.' },
      { type: 'paragraph', text: '→ Module 1 — Introduction', href: workspacePath },
      { type: 'paragraph', text: '→ Week 1: Getting started', href: workspacePath },
    ]);

    const module2Doc = docContent([
      { type: 'heading', level: 1, text: 'Module 2 — Assignments' },
      { type: 'paragraph', text: 'Assignments and submissions. Create tasks linked to pages and track due dates in the Calendar.' },
      { type: 'paragraph', text: '→ Syllabus', href: workspacePath },
      { type: 'paragraph', text: '→ Assignment 1', href: workspacePath },
      { type: 'paragraph', text: '→ Assignment 2', href: workspacePath },
    ]);

    const assignment1Doc = docContent([
      { type: 'heading', level: 1, text: 'Assignment 1' },
      { type: 'paragraph', text: 'Due: see Tasks. Submit your work as described in the course policy. Attach supporting PDFs in the Sources tab and reference them in your Doc.' },
      { type: 'paragraph', text: '→ Module 2 — Assignments', href: workspacePath },
      { type: 'paragraph', text: '→ Assignment 2', href: workspacePath },
    ]);

    const assignment2Doc = docContent([
      { type: 'heading', level: 1, text: 'Assignment 2' },
      { type: 'paragraph', text: 'Second assignment: use Doc for your write-up, Canvas for diagrams or mind maps, and Sources for readings. Extract PDF highlights into the Doc with the "Extract highlights" action.' },
      { type: 'paragraph', text: '→ Module 2 — Assignments', href: workspacePath },
      { type: 'paragraph', text: '→ Assignment 1', href: workspacePath },
    ]);

    const viewport = { x: 0, y: 0, zoom: 1 };

    // Syllabus: course map — central idea + branches
    const canvasSyllabus = {
      elements: [
        { id: 'syl-1', type: 'text-block', x: 320, y: 40, width: 200, height: 56, text: 'Demo Course' },
        { id: 'syl-2', type: 'sticky-note', x: 120, y: 160, width: 140, height: 80, text: 'Doc — notes', color: '#FEF08A' },
        { id: 'syl-3', type: 'sticky-note', x: 340, y: 160, width: 140, height: 80, text: 'Canvas — boards', color: '#BBF7D0' },
        { id: 'syl-4', type: 'sticky-note', x: 560, y: 160, width: 140, height: 80, text: 'Sources — PDFs', color: '#BFDBFE' },
        { id: 'syl-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'syl-1', toId: 'syl-2' },
        { id: 'syl-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'syl-1', toId: 'syl-3' },
        { id: 'syl-c3', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'syl-1', toId: 'syl-4' },
      ],
      viewport,
    };

    // Module 1: intro overview
    const canvasModule1 = {
      elements: [
        { id: 'm1-1', type: 'sticky-note', x: 60, y: 80, width: 160, height: 100, text: 'Getting started', color: '#FEF08A', tag: 'week1' },
        { id: 'm1-2', type: 'sticky-note', x: 260, y: 80, width: 160, height: 100, text: 'Core concepts', color: '#BBF7D0', tag: 'week2' },
        { id: 'm1-3', type: 'shape', x: 460, y: 90, width: 120, height: 80, shapeKind: 'diamond', color: '#E9D5FF', text: 'Module 1' },
        { id: 'm1-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'm1-3', toId: 'm1-1' },
        { id: 'm1-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'm1-3', toId: 'm1-2' },
      ],
      viewport,
    };

    // Week 1: pitch ideas (existing, slightly adjusted)
    const canvasWeek1 = {
      elements: [
        { id: 'w1-1', type: 'sticky-note', x: 80, y: 60, width: 160, height: 100, text: 'Ideas for the pitch', color: '#FEF08A', tag: 'demo' },
        { id: 'w1-2', type: 'sticky-note', x: 280, y: 80, width: 140, height: 80, text: 'Doc + Canvas + PDF', color: '#BBF7D0' },
        { id: 'w1-3', type: 'sticky-note', x: 460, y: 70, width: 150, height: 90, text: 'Collaboration & sharing', color: '#BFDBFE' },
      ],
      viewport,
    };

    // Week 2: concept map with connectors
    const canvasWeek2 = {
      elements: [
        { id: 'w2-1', type: 'text-block', x: 40, y: 50, width: 180, height: 72, text: 'Canvas → Outline\nTurns board items\ninto Doc structure' },
        { id: 'w2-2', type: 'sticky-note', x: 280, y: 40, width: 140, height: 70, text: 'Connectors', color: '#FED7AA' },
        { id: 'w2-3', type: 'sticky-note', x: 460, y: 50, width: 130, height: 65, text: 'Shapes & text', color: '#C4B5FD' },
        { id: 'w2-4', type: 'shape', x: 320, y: 180, width: 100, height: 70, shapeKind: 'ellipse', color: '#BFDBFE', text: 'Export' },
        { id: 'w2-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'w2-2', toId: 'w2-4' },
        { id: 'w2-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'w2-3', toId: 'w2-4' },
      ],
      viewport,
    };

    // Module 2: assignment flow
    const canvasModule2 = {
      elements: [
        { id: 'm2-1', type: 'shape', x: 80, y: 100, width: 100, height: 60, shapeKind: 'rectangle', color: '#BBF7D0', text: 'Assignments' },
        { id: 'm2-2', type: 'sticky-note', x: 260, y: 90, width: 150, height: 85, text: 'Assignment 1\nFirst deliverable', color: '#FEF08A' },
        { id: 'm2-3', type: 'sticky-note', x: 460, y: 90, width: 150, height: 85, text: 'Assignment 2\nSecond deliverable', color: '#BFDBFE' },
        { id: 'm2-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'm2-1', toId: 'm2-2' },
        { id: 'm2-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'm2-1', toId: 'm2-3' },
      ],
      viewport,
    };

    // Assignment 1: task breakdown
    const canvasAssignment1 = {
      elements: [
        { id: 'a1-1', type: 'text-block', x: 60, y: 60, width: 200, height: 64, text: '1. Read materials\n2. Draft in Doc\n3. Attach PDFs in Sources' },
        { id: 'a1-2', type: 'sticky-note', x: 320, y: 70, width: 120, height: 75, text: 'Submit', color: '#86EFAC' },
        { id: 'a1-3', type: 'shape', x: 500, y: 80, width: 90, height: 55, shapeKind: 'diamond', color: '#FDE047', text: 'Done?' },
        { id: 'a1-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'a1-1', toId: 'a1-2' },
        { id: 'a1-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'a1-2', toId: 'a1-3' },
      ],
      viewport,
    };

    // Assignment 2: diagram with mixed elements
    const canvasAssignment2 = {
      elements: [
        { id: 'a2-1', type: 'sticky-note', x: 50, y: 50, width: 140, height: 80, text: 'Write-up in Doc', color: '#FEF08A' },
        { id: 'a2-2', type: 'sticky-note', x: 230, y: 45, width: 140, height: 80, text: 'Diagrams on Canvas', color: '#BBF7D0' },
        { id: 'a2-3', type: 'sticky-note', x: 410, y: 50, width: 140, height: 80, text: 'Readings in Sources', color: '#BFDBFE' },
        { id: 'a2-4', type: 'shape', x: 300, y: 200, width: 120, height: 70, shapeKind: 'ellipse', color: '#E9D5FF', text: 'Final submission' },
        { id: 'a2-c1', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'a2-1', toId: 'a2-4' },
        { id: 'a2-c2', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'a2-2', toId: 'a2-4' },
        { id: 'a2-c3', type: 'connector', x: 0, y: 0, width: 0, height: 0, fromId: 'a2-3', toId: 'a2-4' },
      ],
      viewport,
    };

    const syllabusPage = await createPage('Syllabus', 0, undefined, syllabusDoc, canvasSyllabus);
    const module1 = await createPage('Module 1 — Introduction', 1, undefined, module1Doc, canvasModule1);
    const week1Page = await createPage('Week 1: Getting started', 0, module1.id, week1Doc, canvasWeek1);
    const week2Page = await createPage('Week 2: Core concepts', 1, module1.id, week2Doc, canvasWeek2);
    const module2 = await createPage('Module 2 — Assignments', 2, undefined, module2Doc, canvasModule2);
    const assignment1Page = await createPage('Assignment 1', 0, module2.id, assignment1Doc, canvasAssignment1);
    const assignment2Page = await createPage('Assignment 2', 1, module2.id, assignment2Doc, canvasAssignment2);

    // Demo Sources: different PDF per block (public stable URLs)
    const demoPdfSize = 50000;
    const demoExtractedText = 'Sample document for Nota demo. Use the Sources tab to view and annotate PDFs, then extract highlights into your Doc.';
    const addSource = (pageId: string, fileName: string, fileUrl: string, pageCount = 2) =>
      this.prisma.source.create({
        data: {
          pageId,
          fileName,
          fileUrl,
          fileSize: demoPdfSize,
          mimeType: 'application/pdf',
          pageCount,
          extractedText: demoExtractedText,
        },
      });

    const pdf = {
      syllabus: 'https://www.irs.gov/pub/irs-pdf/p16.pdf',
      module1: 'https://www.irs.gov/pub/irs-pdf/p15.pdf',
      week1: 'https://www.irs.gov/pub/irs-pdf/p501.pdf',
      week2: 'https://www.irs.gov/pub/irs-pdf/p504.pdf',
      module2: 'https://www.irs.gov/pub/irs-pdf/p505.pdf',
      assignment1: 'https://www.irs.gov/pub/irs-pdf/p523.pdf',
      assignment2: 'https://www.irs.gov/pub/irs-pdf/p527.pdf',
    };

    await addSource(syllabusPage.id, 'Course overview (sample).pdf', pdf.syllabus);
    await addSource(module1.id, 'Module 1 reading (sample).pdf', pdf.module1);
    await addSource(week1Page.id, 'Week 1 — Getting started (sample).pdf', pdf.week1);
    await addSource(week2Page.id, 'Week 2 — Core concepts (sample).pdf', pdf.week2);
    await addSource(module2.id, 'Assignment guidelines (sample).pdf', pdf.module2);
    await addSource(assignment1Page.id, 'Assignment 1 brief (sample).pdf', pdf.assignment1);
    await addSource(assignment2Page.id, 'Assignment 2 brief (sample).pdf', pdf.assignment2);

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

  async create(userId: string, dto: CreateWorkspaceInput) {
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
        deletedAt: null,
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
        deletedAt: null,
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
          orderBy: { order: 'asc' },
          include: {
            doc: { select: { id: true } },
            canvas: { select: { id: true } },
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

  /** Move workspace to bin (soft delete). Retained for BIN_RETENTION_DAYS then purged. */
  async delete(id: string, userId: string) {
    await this.checkPermission(id, userId, ['OWNER']);

    await this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /** List workspaces in bin for the current user (as member, any role). */
  async findBin(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        deletedAt: { not: null },
        members: {
          some: { userId },
        },
      },
      include: {
        _count: { select: { pages: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /** Restore a workspace from bin. */
  async restore(id: string, userId: string) {
    await this.checkPermission(id, userId, ['OWNER']);

    await this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: null },
    });

    return { success: true };
  }

  /** Permanently delete a workspace (must be in bin). */
  async purge(id: string, userId: string) {
    await this.checkPermission(id, userId, ['OWNER']);

    const w = await this.prisma.workspace.findUnique({
      where: { id },
      select: { deletedAt: true },
    });
    if (!w?.deletedAt) {
      throw new BadRequestException('Workspace is not in bin. Use delete to move to bin first.');
    }

    await this.prisma.workspace.delete({
      where: { id },
    });

    return { success: true };
  }

  /** Remove from DB workspaces that have been in bin longer than retention days. Call from cron or on demand. */
  async purgeExpired(retentionDays: number = 14): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const expired = await this.prisma.workspace.findMany({
      where: { deletedAt: { lt: cutoff } },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    await this.prisma.workspace.deleteMany({
      where: { id: { in: expired.map((x) => x.id) } },
    });

    return expired.length;
  }

  /** Permanently delete all workspaces in the current user's bin. */
  async emptyBin(userId: string): Promise<number> {
    const inBin = await this.prisma.workspace.findMany({
      where: {
        deletedAt: { not: null },
        members: { some: { userId } },
      },
      select: { id: true },
    });
    if (inBin.length === 0) return 0;
    await this.prisma.workspace.deleteMany({
      where: { id: { in: inBin.map((x) => x.id) } },
    });
    return inBin.length;
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

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      select: { userId: true, role: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Prevent the last owner from demoting themselves (would leave workspace with no owner)
    if (member.userId === userId && member.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('You cannot change your own role because you are the only owner. Add another owner first or transfer ownership.');
      }
    }

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
