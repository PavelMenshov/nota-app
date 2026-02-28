import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shared workspace access check. Use from Pages, Tasks, Calendar, Export services
 * to avoid duplicating membership and role logic.
 */
@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAccess(
    workspaceId: string,
    userId: string,
    allowedRoles?: string[],
  ): Promise<{ workspaceId: string; userId: string; role: string }> {
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

    if (allowedRoles?.length && !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return {
      workspaceId,
      userId,
      role: member.role,
    };
  }
}
