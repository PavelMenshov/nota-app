import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExportJobDto, SendToNotionDto } from './dto/export.dto';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post()
  @ApiOperation({ summary: 'Create an export job' })
  @ApiResponse({ status: 201, description: 'Export job created' })
  async createExportJob(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateExportJobDto,
  ) {
    return this.exportService.createExportJob(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all export jobs for current user' })
  @ApiResponse({ status: 200, description: 'List of export jobs' })
  async getExportJobs(@Request() req: { user: { userId: string } }) {
    return this.exportService.getExportJobs(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get export job status' })
  @ApiResponse({ status: 200, description: 'Export job details' })
  async getExportJob(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.exportService.getExportJob(id, req.user.userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download completed export file' })
  @ApiResponse({ status: 200, description: 'Export file download' })
  async downloadExport(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { downloadUrl } = await this.exportService.downloadExport(id, req.user.userId);

    // downloadUrl is like /exports/{jobId}.pdf
    const fileName = path.basename(downloadUrl);
    // Sanitize fileName to prevent path traversal
    const safeName = path.basename(fileName);
    const filePath = path.resolve(EXPORTS_DIR, safeName);

    // Verify the resolved path is within EXPORTS_DIR
    if (!filePath.startsWith(path.resolve(EXPORTS_DIR))) {
      throw new NotFoundException('Export file not found');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Export file not found');
    }

    const ext = path.extname(fileName).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.md': 'text/markdown',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.sendFile(filePath);
  }

  @Post('send-to-notion')
  @ApiOperation({ summary: 'Send page content to Notion' })
  @ApiResponse({ status: 201, description: 'Page created in Notion' })
  async sendToNotion(
    @Request() req: { user: { userId: string } },
    @Body() dto: SendToNotionDto,
  ) {
    return this.exportService.sendToNotion(req.user.userId, dto);
  }
}
