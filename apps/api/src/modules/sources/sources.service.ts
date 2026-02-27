import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/sources.dto';
import { Prisma } from '@nota/database';

@Injectable()
export class SourcesService {
  constructor(private prisma: PrismaService) {}

  async getSources(pageId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId);

    return this.prisma.source.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSource(pageId: string, sourceId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId);

    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, pageId },
      include: {
        annotations: {
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
          orderBy: { pageNumber: 'asc' },
        },
      },
    });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    return source;
  }

  async uploadSource(
    pageId: string,
    userId: string,
    file: { filename: string; url: string; size: number; mimeType: string },
    pageCount?: number,
  ) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (!allowedMimeTypes.includes(file.mimeType)) {
      throw new BadRequestException('Only PDF, DOCX, and PPTX files are allowed');
    }

    const source = await this.prisma.source.create({
      data: {
        pageId,
        fileName: file.filename,
        fileUrl: file.url,
        fileSize: file.size,
        mimeType: file.mimeType,
        pageCount,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId,
        userId,
        action: 'uploaded_source',
        details: { fileName: file.filename },
      },
    });

    return source;
  }

  async deleteSource(pageId: string, sourceId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, pageId },
    });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    await this.prisma.source.delete({
      where: { id: sourceId },
    });

    return { success: true };
  }

  // Search within PDF text
  async searchSources(pageId: string, userId: string, query: string) {
    await this.getPageWithAccess(pageId, userId);

    return this.prisma.source.findMany({
      where: {
        pageId,
        OR: [
          { fileName: { contains: query, mode: 'insensitive' } },
          { extractedText: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  // Annotations
  async createAnnotation(sourceId: string, userId: string, dto: CreateAnnotationDto) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      include: { page: true },
    });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    await this.getPageWithAccess(source.pageId, userId);

    const annotation = await this.prisma.pDFAnnotation.create({
      data: {
        sourceId,
        userId,
        type: dto.type,
        content: dto.content,
        color: dto.color,
        pageNumber: dto.pageNumber,
        position: dto.position as Prisma.InputJsonValue,
        selectedText: dto.selectedText,
      },
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
    });

    return annotation;
  }

  async updateAnnotation(annotationId: string, userId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.pDFAnnotation.findUnique({
      where: { id: annotationId },
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException('Cannot edit annotation created by another user');
    }

    return this.prisma.pDFAnnotation.update({
      where: { id: annotationId },
      data: {
        content: dto.content,
        color: dto.color,
      },
    });
  }

  async deleteAnnotation(annotationId: string, userId: string) {
    const annotation = await this.prisma.pDFAnnotation.findUnique({
      where: { id: annotationId },
      include: { source: { include: { page: true } } },
    });

    if (!annotation) {
      throw new NotFoundException('Annotation not found');
    }

    // Author or editor can delete
    if (annotation.userId !== userId) {
      await this.getPageWithAccess(annotation.source.pageId, userId, ['OWNER', 'EDITOR']);
    }

    await this.prisma.pDFAnnotation.delete({
      where: { id: annotationId },
    });

    return { success: true };
  }

  // Extract highlights to doc
  async extractHighlightsToDoc(pageId: string, sourceId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, pageId },
    });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    // Get highlights
    const highlights = await this.prisma.pDFAnnotation.findMany({
      where: {
        sourceId,
        type: 'HIGHLIGHT',
        selectedText: { not: null },
      },
      orderBy: { pageNumber: 'asc' },
    });

    if (highlights.length === 0) {
      return { success: true, extracted: 0 };
    }

    // Convert highlights to doc blocks
    const blocks = highlights.map((h) => ({
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: h.selectedText }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `— ${source.fileName}, p. ${h.pageNumber}`,
              marks: [{ type: 'italic' }],
            },
          ],
        },
      ],
    }));

    // Append to doc
    const doc = await this.prisma.doc.findUnique({
      where: { pageId },
    });

    if (doc) {
      const docContent = doc.content as { type: string; content: unknown[] };
      const newContent = {
        ...docContent,
        content: [...(docContent.content || []), ...blocks],
      };

      await this.prisma.doc.update({
        where: { pageId },
        data: {
          content: newContent as Prisma.InputJsonValue,
          plainText: (doc.plainText || '') + '\n' + highlights.map((h) => h.selectedText).join('\n'),
        },
      });
    }

    return { success: true, extracted: highlights.length };
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
