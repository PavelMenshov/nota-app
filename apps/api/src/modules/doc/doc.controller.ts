import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DocService } from './doc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDocDto, CreateCommentDto, ResolveCommentDto } from './dto/doc.dto';

@ApiTags('doc')
@Controller('pages/:pageId/doc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocController {
  constructor(private docService: DocService) {}

  @Get()
  @ApiOperation({ summary: 'Get document for a page' })
  @ApiResponse({ status: 200, description: 'Document content' })
  async getDoc(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.docService.getDoc(pageId, req.user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update document content' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async updateDoc(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Body() dto: UpdateDocDto,
  ) {
    return this.docService.updateDoc(pageId, req.user.userId, dto);
  }

  @Post('snapshots')
  @ApiOperation({ summary: 'Create a snapshot of current document' })
  @ApiResponse({ status: 201, description: 'Snapshot created' })
  async createSnapshot(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.docService.createSnapshot(pageId, req.user.userId);
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get document snapshots' })
  @ApiResponse({ status: 200, description: 'List of snapshots' })
  async getSnapshots(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.docService.getSnapshots(pageId, req.user.userId);
  }

  @Post('snapshots/:snapshotId/restore')
  @ApiOperation({ summary: 'Restore document from snapshot' })
  @ApiResponse({ status: 200, description: 'Document restored' })
  async restoreSnapshot(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.docService.restoreSnapshot(pageId, snapshotId, req.user.userId);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Add a comment to document' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async createComment(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.docService.createComment(pageId, req.user.userId, dto);
  }

  @Put('comments/:commentId/resolve')
  @ApiOperation({ summary: 'Resolve/unresolve a comment' })
  @ApiResponse({ status: 200, description: 'Comment resolved' })
  async resolveComment(
    @Request() req: { user: { userId: string } },
    @Param('commentId') commentId: string,
    @Body() dto: ResolveCommentDto,
  ) {
    return this.docService.resolveComment(commentId, req.user.userId, dto.resolved);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Request() req: { user: { userId: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.docService.deleteComment(commentId, req.user.userId);
  }
}
