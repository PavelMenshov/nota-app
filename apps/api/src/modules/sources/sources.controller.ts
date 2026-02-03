import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/sources.dto';

@ApiTags('sources')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Get('pages/:pageId/sources')
  @ApiOperation({ summary: 'Get all sources (PDFs) for a page' })
  @ApiResponse({ status: 200, description: 'List of sources' })
  async getSources(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.sourcesService.getSources(pageId, req.user.userId);
  }

  @Get('pages/:pageId/sources/search')
  @ApiOperation({ summary: 'Search within sources' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchSources(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Query('q') query: string,
  ) {
    return this.sourcesService.searchSources(pageId, req.user.userId, query);
  }

  @Get('pages/:pageId/sources/:sourceId')
  @ApiOperation({ summary: 'Get a source with annotations' })
  @ApiResponse({ status: 200, description: 'Source details' })
  async getSource(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.sourcesService.getSource(pageId, sourceId, req.user.userId);
  }

  @Post('pages/:pageId/sources/upload')
  @ApiOperation({ summary: 'Upload a PDF source' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Source uploaded' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSource(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // In production, you would upload to S3/cloud storage and get URL
    // For demo, we'll use a placeholder URL
    const fileData = {
      filename: file.originalname,
      url: `/uploads/${Date.now()}-${file.originalname}`,
      size: file.size,
      mimeType: file.mimetype,
    };
    
    return this.sourcesService.uploadSource(pageId, req.user.userId, fileData);
  }

  @Delete('pages/:pageId/sources/:sourceId')
  @ApiOperation({ summary: 'Delete a source' })
  @ApiResponse({ status: 200, description: 'Source deleted' })
  async deleteSource(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.sourcesService.deleteSource(pageId, sourceId, req.user.userId);
  }

  @Post('pages/:pageId/sources/:sourceId/extract-highlights')
  @ApiOperation({ summary: 'Extract highlights from PDF to document' })
  @ApiResponse({ status: 200, description: 'Highlights extracted' })
  async extractHighlights(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.sourcesService.extractHighlightsToDoc(pageId, sourceId, req.user.userId);
  }

  // Annotations
  @Post('sources/:sourceId/annotations')
  @ApiOperation({ summary: 'Create an annotation on a PDF' })
  @ApiResponse({ status: 201, description: 'Annotation created' })
  async createAnnotation(
    @Request() req: { user: { userId: string } },
    @Param('sourceId') sourceId: string,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.sourcesService.createAnnotation(sourceId, req.user.userId, dto);
  }

  @Put('sources/annotations/:annotationId')
  @ApiOperation({ summary: 'Update an annotation' })
  @ApiResponse({ status: 200, description: 'Annotation updated' })
  async updateAnnotation(
    @Request() req: { user: { userId: string } },
    @Param('annotationId') annotationId: string,
    @Body() dto: UpdateAnnotationDto,
  ) {
    return this.sourcesService.updateAnnotation(annotationId, req.user.userId, dto);
  }

  @Delete('sources/annotations/:annotationId')
  @ApiOperation({ summary: 'Delete an annotation' })
  @ApiResponse({ status: 200, description: 'Annotation deleted' })
  async deleteAnnotation(
    @Request() req: { user: { userId: string } },
    @Param('annotationId') annotationId: string,
  ) {
    return this.sourcesService.deleteAnnotation(annotationId, req.user.userId);
  }
}
