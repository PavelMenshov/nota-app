import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLmsIntegrationDto } from './dto/lms.dto';
import { LmsProvider } from '@prisma/client';

@Injectable()
export class LmsService {
  constructor(private prisma: PrismaService) {}

  async listIntegrations(userId: string) {
    return this.prisma.lmsIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        baseUrl: true,
        createdAt: true,
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntegration(userId: string, dto: CreateLmsIntegrationDto) {
    return this.prisma.lmsIntegration.create({
      data: {
        userId,
        provider: dto.provider as LmsProvider,
        baseUrl: dto.baseUrl.trim(),
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken ?? undefined,
      },
      select: {
        id: true,
        provider: true,
        baseUrl: true,
        createdAt: true,
      },
    });
  }

  async getCourses(integrationId: string, userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
      include: { courses: true },
    });
    if (!integration) {
      throw new NotFoundException('LMS integration not found');
    }
    // For demo: return stored courses; if none, return mock list so UI can be tested
    if (integration.courses.length > 0) {
      return integration.courses.map((c) => ({
        id: c.id,
        externalId: c.externalId,
        name: c.name,
        code: c.code,
        term: c.term,
        syncedAt: c.syncedAt.toISOString ? c.syncedAt.toISOString() : String(c.syncedAt),
      }));
    }
    // Mock courses for demo when no real LMS API is connected
    return [
      { id: 'mock-1', externalId: 'ext-1', name: 'Introduction to Computer Science', code: 'CS101', term: 'Fall 2025', syncedAt: new Date().toISOString() },
      { id: 'mock-2', externalId: 'ext-2', name: 'Data Structures', code: 'CS201', term: 'Fall 2025', syncedAt: new Date().toISOString() },
    ];
  }

}
