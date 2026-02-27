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
  Res,
  NotFoundException as HttpNotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { FilesService } from '../files/files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto/sources.dto';
import { diskStorage } from 'multer';
import { extname, join, basename } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists (fallback for multer temp storage)
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@ApiTags('sources')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SourcesController {
  constructor(
    private sourcesService: SourcesService,
    private filesService: FilesService,
  ) {}

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
  @ApiOperation({ summary: 'Upload a document source (PDF, DOCX, PPTX)' })
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
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadSource(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload via FilesService (will use S3/MinIO if configured, disk otherwise)
    let url: string;
    try {
      const result = await this.filesService.uploadFromPath(file.path, file.originalname, file.mimetype);
      url = result.url;
    } catch (error) {
      // Handle S3/MinIO connection errors (AggregateError) and other upload failures
      const message = error instanceof Error ? error.message : 'File storage upload failed. Please check storage configuration.';
      throw new BadRequestException(`Upload failed: ${message}`);
    }

    const fileData = {
      filename: file.originalname,
      url,
      size: file.size,
      mimeType: file.mimetype,
    };
    
    return this.sourcesService.uploadSource(pageId, req.user.userId, fileData);
  }

  @Get('sources/files/:filename')
  @ApiOperation({ summary: 'Download an uploaded file' })
  @ApiResponse({ status: 200, description: 'File content' })
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Sanitize filename to prevent path traversal
    const safeName = basename(filename);

    // Determine content type from extension
    const ext = extname(safeName).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    const { stream, localPath } = await this.filesService.getFileStream(safeName);
    
    if (stream) {
      // S3 stream
      res.setHeader('Content-Type', contentType);
      (stream as NodeJS.ReadableStream).pipe(res);
    } else if (localPath) {
      res.setHeader('Content-Type', contentType);
      res.sendFile(localPath);
    } else {
      throw new HttpNotFoundException('File not found');
    }
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
