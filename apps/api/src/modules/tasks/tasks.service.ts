import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAccessService } from '../../common/workspace-access/workspace-access.service';
import type { CreateTaskInput } from '@nota/shared';
import { UpdateTaskDto } from './dto/tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async create(userId: string, dto: CreateTaskInput) {
    const { role } = await this.workspaceAccess.checkAccess(dto.workspaceId, userId);
    if (role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (dto.assignedToAll && role !== 'OWNER' && role !== 'PROFESSOR') {
      throw new ForbiddenException('Only owners or professors can assign tasks to all members');
    }

    const task = await this.prisma.task.create({
      data: {
        workspaceId: dto.workspaceId,
        pageId: dto.pageId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'TODO',
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedToAll: dto.assignedToAll ?? false,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignees: {
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return task;
  }

  async findAll(workspaceId: string, userId: string) {
    await this.workspaceAccess.checkAccess(workspaceId, userId);

    return this.prisma.task.findMany({
      where: { workspaceId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignees: {
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        workspace: {
          include: { members: true },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignees: {
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const hasAccess = task.workspace.members.some((m) => m.userId === userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { workspace: { include: { members: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = task.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (dto.assignedToAll !== undefined && dto.assignedToAll && member.role !== 'OWNER' && member.role !== 'PROFESSOR') {
      throw new ForbiddenException('Only owners or professors can assign tasks to all members');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        pageId: dto.pageId,
        assignedToAll: dto.assignedToAll,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignees: {
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
    });
  }

  async delete(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { workspace: { include: { members: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = task.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.task.delete({
      where: { id },
    });

    return { success: true };
  }

  async addAssignee(taskId: string, userId: string, assigneeId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { workspace: { include: { members: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = task.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check if assignee is a workspace member
    const assigneeMember = task.workspace.members.find((m) => m.userId === assigneeId);
    if (!assigneeMember) {
      throw new ForbiddenException('User is not a workspace member');
    }

    return this.prisma.taskAssignee.create({
      data: {
        taskId,
        userId: assigneeId,
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
  }

  async removeAssignee(taskId: string, userId: string, assigneeId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { workspace: { include: { members: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const member = task.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.taskAssignee.deleteMany({
      where: {
        taskId,
        userId: assigneeId,
      },
    });

    return { success: true };
  }

}
