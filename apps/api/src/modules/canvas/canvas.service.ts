import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateCanvasDto, ConvertToOutlineDto } from './dto/canvas.dto';

@Injectable()
export class CanvasService {
  constructor(private prisma: PrismaService) {}

  async getCanvas(pageId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId);

    let canvas = await this.prisma.canvas.findUnique({
      where: { pageId },
    });

    if (!canvas) {
      // Create empty canvas if doesn't exist
      canvas = await this.prisma.canvas.create({
        data: {
          pageId,
          content: { elements: [], viewport: { x: 0, y: 0, zoom: 1 } },
        },
      });
    }

    return canvas;
  }

  async updateCanvas(pageId: string, userId: string, dto: UpdateCanvasDto) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const canvas = await this.prisma.canvas.upsert({
      where: { pageId },
      create: {
        pageId,
        content: dto.content,
      },
      update: {
        content: dto.content,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId,
        userId,
        action: 'edited_canvas',
        details: { timestamp: new Date().toISOString() },
      },
    });

    return canvas;
  }

  async createSnapshot(pageId: string, userId: string) {
    const canvas = await this.prisma.canvas.findUnique({
      where: { pageId },
    });

    if (!canvas) {
      throw new NotFoundException('Canvas not found');
    }

    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    // Get current version
    const lastSnapshot = await this.prisma.canvasSnapshot.findFirst({
      where: { canvasId: canvas.id },
      orderBy: { version: 'desc' },
    });

    const snapshot = await this.prisma.canvasSnapshot.create({
      data: {
        canvasId: canvas.id,
        content: canvas.content as object,
        version: (lastSnapshot?.version || 0) + 1,
        createdBy: userId,
      },
    });

    return snapshot;
  }

  async getSnapshots(pageId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId);

    const canvas = await this.prisma.canvas.findUnique({
      where: { pageId },
    });

    if (!canvas) {
      throw new NotFoundException('Canvas not found');
    }

    return this.prisma.canvasSnapshot.findMany({
      where: { canvasId: canvas.id },
      orderBy: { version: 'desc' },
      take: 50,
    });
  }

  async restoreSnapshot(pageId: string, snapshotId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const snapshot = await this.prisma.canvasSnapshot.findUnique({
      where: { id: snapshotId },
      include: { canvas: true },
    });

    if (!snapshot || snapshot.canvas.pageId !== pageId) {
      throw new NotFoundException('Snapshot not found');
    }

    const canvas = await this.prisma.canvas.update({
      where: { pageId },
      data: {
        content: snapshot.content,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId,
        userId,
        action: 'restored_canvas_snapshot',
        details: { snapshotId, version: snapshot.version },
      },
    });

    return canvas;
  }

  // Convert Canvas elements to Document outline
  async convertToOutline(pageId: string, userId: string, dto: ConvertToOutlineDto) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const canvas = await this.prisma.canvas.findUnique({
      where: { pageId },
    });

    if (!canvas) {
      throw new NotFoundException('Canvas not found');
    }

    // Extract text elements from canvas content
    const content = canvas.content as { elements?: Array<{ type: string; text?: string; id: string }> };
    const elements = content.elements || [];

    // Filter selected elements or all text elements
    const textElements = elements
      .filter((el) => {
        if (dto.elementIds && dto.elementIds.length > 0) {
          return dto.elementIds.includes(el.id) && el.type === 'text';
        }
        return el.type === 'text' && el.text;
      })
      .map((el) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: el.text }],
      }));

    // Get current doc
    const doc = await this.prisma.doc.findUnique({
      where: { pageId },
    });

    if (doc) {
      // Append to existing doc
      const docContent = doc.content as { type: string; content: unknown[] };
      const newContent = {
        ...docContent,
        content: [...(docContent.content || []), ...textElements],
      };

      await this.prisma.doc.update({
        where: { pageId },
        data: {
          content: newContent,
          plainText: (doc.plainText || '') + '\n' + textElements.map((el) => {
            const textContent = el.content[0] as { text?: string };
            return textContent.text || '';
          }).join('\n'),
        },
      });
    }

    return { success: true, elementsConverted: textElements.length };
  }

  private async getPageWithAccess(pageId: string, userId: string, allowedRoles?: string[]) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const member = page.workspace.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    if (allowedRoles && !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return page;
  }
}
