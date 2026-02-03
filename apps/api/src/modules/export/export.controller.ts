import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExportJobDto } from './dto/export.dto';

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
  @ApiOperation({ summary: 'Download completed export' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  async downloadExport(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.exportService.downloadExport(id, req.user.userId);
  }
}
