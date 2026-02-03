import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateDocDto, CreateCommentDto } from './dto/doc.dto';
import { Prisma } from '@eywa/database';

@Injectable()
export class DocService {
  constructor(private prisma: PrismaService) {}

  async getDoc(pageId: string, userId: string) {
    const _page = await this.getPageWithAccess(pageId, userId);

    let doc = await this.prisma.doc.findUnique({
      where: { pageId },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            replies: {
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
            },
          },
          where: {
            parentId: null,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!doc) {
      // Create empty doc if doesn't exist
      doc = await this.prisma.doc.create({
        data: {
          pageId,
          content: { type: 'doc', content: [] } as Prisma.InputJsonValue,
          plainText: '',
        },
        include: {
          comments: {
            where: { parentId: null },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              replies: {
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
              },
            },
          },
        },
      });
    }

    return doc;
  }

  async updateDoc(pageId: string, userId: string, dto: UpdateDocDto) {
    const _page = await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const doc = await this.prisma.doc.upsert({
      where: { pageId },
      create: {
        pageId,
        content: dto.content as Prisma.InputJsonValue,
        plainText: dto.plainText,
      },
      update: {
        content: dto.content as Prisma.InputJsonValue,
        plainText: dto.plainText,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId,
        userId,
        action: 'edited_doc',
        details: { timestamp: new Date().toISOString() },
      },
    });

    return doc;
  }

  async createSnapshot(pageId: string, userId: string) {
    const doc = await this.prisma.doc.findUnique({
      where: { pageId },
    });

    if (!doc) {
      throw new NotFoundException('Doc not found');
    }

    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    // Get current version
    const lastSnapshot = await this.prisma.docSnapshot.findFirst({
      where: { docId: doc.id },
      orderBy: { version: 'desc' },
    });

    const snapshot = await this.prisma.docSnapshot.create({
      data: {
        docId: doc.id,
        content: doc.content as object,
        plainText: doc.plainText,
        version: (lastSnapshot?.version || 0) + 1,
        createdBy: userId,
      },
    });

    return snapshot;
  }

  async getSnapshots(pageId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId);

    const doc = await this.prisma.doc.findUnique({
      where: { pageId },
    });

    if (!doc) {
      throw new NotFoundException('Doc not found');
    }

    return this.prisma.docSnapshot.findMany({
      where: { docId: doc.id },
      orderBy: { version: 'desc' },
      take: 50,
    });
  }

  async restoreSnapshot(pageId: string, snapshotId: string, userId: string) {
    await this.getPageWithAccess(pageId, userId, ['OWNER', 'EDITOR']);

    const snapshot = await this.prisma.docSnapshot.findUnique({
      where: { id: snapshotId },
      include: { doc: true },
    });

    if (!snapshot || snapshot.doc.pageId !== pageId) {
      throw new NotFoundException('Snapshot not found');
    }

    const doc = await this.prisma.doc.update({
      where: { pageId },
      data: {
        content: snapshot.content as Prisma.InputJsonValue,
        plainText: snapshot.plainText,
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        pageId,
        userId,
        action: 'restored_snapshot',
        details: { snapshotId, version: snapshot.version },
      },
    });

    return doc;
  }

  // Comments
  async createComment(pageId: string, userId: string, dto: CreateCommentDto) {
    await this.getPageWithAccess(pageId, userId);

    const doc = await this.prisma.doc.findUnique({
      where: { pageId },
    });

    if (!doc) {
      throw new NotFoundException('Doc not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        docId: doc.id,
        userId,
        content: dto.content,
        position: (dto.position as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        parentId: dto.parentId,
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

    return comment;
  }

  async resolveComment(commentId: string, userId: string, resolved: boolean) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { doc: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.getPageWithAccess(comment.doc.pageId, userId, ['OWNER', 'EDITOR']);

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolved },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { doc: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the author or workspace owner/editor can delete
    if (comment.userId !== userId) {
      await this.getPageWithAccess(comment.doc.pageId, userId, ['OWNER', 'EDITOR']);
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true };
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
