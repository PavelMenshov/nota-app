import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    await this.checkWorkspaceAccess(dto.workspaceId, userId);

    return this.prisma.calendarEvent.create({
      data: {
        workspaceId: dto.workspaceId,
        pageId: dto.pageId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        allDay: dto.allDay || false,
        location: dto.location,
        color: dto.color,
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findAll(workspaceId: string, userId: string, startDate?: string, endDate?: string) {
    await this.checkWorkspaceAccess(workspaceId, userId);

    const where: { workspaceId: string; startTime?: { gte?: Date }; endTime?: { lte?: Date } } = { workspaceId };

    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }

    return this.prisma.calendarEvent.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const hasAccess = event.workspace.members.some((m) => m.userId === userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return event;
  }

  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: { workspace: { include: { members: true } } },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const member = event.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        allDay: dto.allDay,
        location: dto.location,
        color: dto.color,
        pageId: dto.pageId,
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
        page: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: { workspace: { include: { members: true } } },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const member = event.workspace.members.find((m) => m.userId === userId);
    if (!member || member.role === 'VIEWER') {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    return { success: true };
  }

  private async checkWorkspaceAccess(workspaceId: string, userId: string) {
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

    return member;
  }
}
