import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddMemberDto } from './dto/workspaces.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

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
