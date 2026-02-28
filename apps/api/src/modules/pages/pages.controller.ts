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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { createPageSchema, type CreatePageInput } from '@nota/shared';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { UpdatePageDto, GeneratePageShareLinkDto } from './dto/pages.dto';

@ApiTags('pages')
@Controller('pages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new page' })
  @ApiResponse({ status: 201, description: 'Page created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body(ZodValidationPipe.with(createPageSchema)) dto: CreatePageInput,
  ) {
    return this.pagesService.create(req.user.userId, dto);
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get all pages in a workspace' })
  @ApiResponse({ status: 200, description: 'List of pages' })
  async findAllByWorkspace(
    @Request() req: { user: { userId: string } },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.pagesService.findAllByWorkspace(workspaceId, req.user.userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search pages' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'q', required: true })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Request() req: { user: { userId: string } },
    @Query('workspaceId') workspaceId: string,
    @Query('q') query: string,
  ) {
    return this.pagesService.search(workspaceId, req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a page by ID' })
  @ApiResponse({ status: 200, description: 'Page details' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async findOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.pagesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a page' })
  @ApiResponse({ status: 200, description: 'Page updated' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a page' })
  @ApiResponse({ status: 200, description: 'Page deleted' })
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.pagesService.delete(id, req.user.userId);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate share link for page' })
  @ApiResponse({ status: 200, description: 'Share link generated' })
  async generateShareLink(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: GeneratePageShareLinkDto,
  ) {
    return this.pagesService.generateShareLink(id, req.user.userId, dto.role);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get page activity history' })
  @ApiResponse({ status: 200, description: 'Activity history' })
  async getActivity(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.pagesService.getActivity(id, req.user.userId);
  }
}
