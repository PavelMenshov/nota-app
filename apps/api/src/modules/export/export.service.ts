import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExportJobDto } from './dto/export.dto';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async createExportJob(userId: string, dto: CreateExportJobDto) {
    // Validate access to pages/workspace
    if (dto.config.pageIds) {
      for (const pageId of dto.config.pageIds) {
        await this.checkPageAccess(pageId, userId);
      }
    } else if (dto.config.workspaceId) {
      await this.checkWorkspaceAccess(dto.config.workspaceId, userId);
    }

    // Create export job
    const job = await this.prisma.exportJob.create({
      data: {
        userId,
        type: dto.type,
        status: 'PENDING',
        config: dto.config as object,
      },
    });

    // In production, this would trigger a background job
    // For demo, we'll process it immediately (simplified)
    this.processExportJob(job.id);

    return job;
  }

  async getExportJob(jobId: string, userId: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== userId) {
      throw new NotFoundException('Export job not found');
    }

    return job;
  }

  async getExportJobs(userId: string) {
    return this.prisma.exportJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async downloadExport(jobId: string, userId: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== userId) {
      throw new NotFoundException('Export job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new ForbiddenException('Export job is not completed yet');
    }

    if (!job.resultUrl) {
      throw new NotFoundException('Export file not available');
    }

    return { downloadUrl: job.resultUrl };
  }

  private async processExportJob(jobId: string) {
    // Update status to processing
    await this.prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      const job = await this.prisma.exportJob.findUnique({
        where: { id: jobId },
      });

      if (!job) return;

      const config = job.config as { pageIds?: string[]; workspaceId?: string };

      // Get content to export
      let content = '';
      const pages: Array<{ id: string; title: string; doc: { plainText: string | null } | null }> = [];

      if (config.pageIds) {
        for (const pageId of config.pageIds) {
          const page = await this.prisma.page.findUnique({
            where: { id: pageId },
            include: { doc: true },
          });
          if (page) pages.push(page);
        }
      } else if (config.workspaceId) {
        const workspacePages = await this.prisma.page.findMany({
          where: { workspaceId: config.workspaceId },
          include: { doc: true },
        });
        pages.push(...workspacePages);
      }

      // Generate content based on export type
      for (const page of pages) {
        content += `# ${page.title}\n\n`;
        if (page.doc?.plainText) {
          content += page.doc.plainText + '\n\n';
        }
        content += '---\n\n';
      }

      // In production, you would:
      // - Generate actual PDF/DOCX using libraries like pdf-lib, docx, etc.
      // - Upload to cloud storage
      // - Store the URL

      // For demo, we'll create a placeholder
      const resultUrl = `/exports/${jobId}.${job.type.toLowerCase()}`;

      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          resultUrl,
        },
      });
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private async checkPageAccess(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: { members: true },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const hasAccess = page.workspace.members.some((m) => m.userId === userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }
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
  }
}
