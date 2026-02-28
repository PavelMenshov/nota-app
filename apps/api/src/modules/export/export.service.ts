import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAccessService } from '../../common/workspace-access/workspace-access.service';
import { CreateExportJobDto, SendToNotionDto } from './dto/export.dto';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from 'docx';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }
  }

  async createExportJob(userId: string, dto: CreateExportJobDto) {
    // Validate access to pages/workspace
    if (dto.config.pageIds) {
      for (const pageId of dto.config.pageIds) {
        await this.checkPageAccess(pageId, userId);
      }
    } else if (dto.config.workspaceId) {
      await this.workspaceAccess.checkAccess(dto.config.workspaceId, userId);
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

    // Process immediately (in production this would be a background job)
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

  async sendToNotion(userId: string, dto: SendToNotionDto) {
    await this.checkPageAccess(dto.pageId, userId);

    const page = await this.prisma.page.findUnique({
      where: { id: dto.pageId },
      include: { doc: true },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const text = page.doc?.plainText || '';

    // Build Notion blocks from content
    const blocks = text
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 100) // Notion API limit
      .map((line) => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{ type: 'text' as const, text: { content: line.slice(0, 2000) } }],
        },
      }));

    // Notion requires a parent page
    if (!dto.parentPageId) {
      throw new BadRequestException(
        'parentPageId is required. Provide a Notion page ID where the new page will be created.',
      );
    }

    // Build request body
    const body = {
      parent: { page_id: dto.parentPageId },
      properties: {
        title: [{ text: { content: page.title } }],
      },
      children: blocks,
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dto.notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown Notion API error' }));
      throw new BadRequestException(
        `Notion API error: ${(error as { message?: string }).message || response.statusText}`,
      );
    }

    const notionPage = await response.json() as { id: string; url: string };
    return { success: true, notionPageId: notionPage.id, notionUrl: notionPage.url };
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

      // Collect pages
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

      let resultUrl: string;

      switch (job.type) {
        case 'PDF':
          resultUrl = await this.generatePdf(jobId, pages);
          break;
        case 'DOCX':
          resultUrl = await this.generateDocx(jobId, pages);
          break;
        case 'MARKDOWN':
        default:
          resultUrl = await this.generateMarkdown(jobId, pages);
          break;
      }

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

  private async generatePdf(
    jobId: string,
    pages: Array<{ title: string; doc: { plainText: string | null } | null }>,
  ): Promise<string> {
    const filePath = path.join(EXPORTS_DIR, `${jobId}.pdf`);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold').text(pages[i].title, { align: 'left' });
        doc.moveDown();
        const text = pages[i].doc?.plainText || '(No content)';
        doc.fontSize(12).font('Helvetica').text(text, { align: 'left', lineGap: 4 });
      }

      doc.end();
      stream.on('finish', () => resolve(`/exports/${jobId}.pdf`));
      stream.on('error', reject);
    });
  }

  private async generateDocx(
    jobId: string,
    pages: Array<{ title: string; doc: { plainText: string | null } | null }>,
  ): Promise<string> {
    const filePath = path.join(EXPORTS_DIR, `${jobId}.docx`);

    const children: Paragraph[] = [];
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      children.push(
        new Paragraph({
          text: pages[i].title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        }),
      );
      const text = pages[i].doc?.plainText || '(No content)';
      const lines = text.split('\n');
      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
          }),
        );
      }
    }

    const docxDoc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(docxDoc);
    fs.writeFileSync(filePath, buffer);

    return `/exports/${jobId}.docx`;
  }

  private async generateMarkdown(
    jobId: string,
    pages: Array<{ title: string; doc: { plainText: string | null } | null }>,
  ): Promise<string> {
    const filePath = path.join(EXPORTS_DIR, `${jobId}.md`);

    let content = '';
    for (const page of pages) {
      content += `# ${page.title}\n\n`;
      if (page.doc?.plainText) {
        content += page.doc.plainText + '\n\n';
      }
      content += '---\n\n';
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return `/exports/${jobId}.md`;
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

}
