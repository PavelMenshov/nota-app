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
import { CanvasService } from './canvas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCanvasDto, ConvertToOutlineDto, CreateCanvasCommentDto, ResolveCanvasCommentDto } from './dto/canvas.dto';

@ApiTags('canvas')
@Controller('pages/:pageId/canvas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @Get()
  @ApiOperation({ summary: 'Get canvas for a page' })
  @ApiResponse({ status: 200, description: 'Canvas content' })
  async getCanvas(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.canvasService.getCanvas(pageId, req.user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update canvas content' })
  @ApiResponse({ status: 200, description: 'Canvas updated' })
  async updateCanvas(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Body() dto: UpdateCanvasDto,
  ) {
    return this.canvasService.updateCanvas(pageId, req.user.userId, dto);
  }

  @Post('snapshots')
  @ApiOperation({ summary: 'Create a snapshot of current canvas' })
  @ApiResponse({ status: 201, description: 'Snapshot created' })
  async createSnapshot(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.canvasService.createSnapshot(pageId, req.user.userId);
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get canvas snapshots' })
  @ApiResponse({ status: 200, description: 'List of snapshots' })
  async getSnapshots(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
  ) {
    return this.canvasService.getSnapshots(pageId, req.user.userId);
  }

  @Post('snapshots/:snapshotId/restore')
  @ApiOperation({ summary: 'Restore canvas from snapshot' })
  @ApiResponse({ status: 200, description: 'Canvas restored' })
  async restoreSnapshot(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.canvasService.restoreSnapshot(pageId, snapshotId, req.user.userId);
  }

  @Post('convert-to-outline')
  @ApiOperation({ summary: 'Convert canvas elements to document outline' })
  @ApiResponse({ status: 200, description: 'Elements converted' })
  async convertToOutline(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Body() dto: ConvertToOutlineDto,
  ) {
    return this.canvasService.convertToOutline(pageId, req.user.userId, dto);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Add a comment to canvas' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async createComment(
    @Request() req: { user: { userId: string } },
    @Param('pageId') pageId: string,
    @Body() dto: CreateCanvasCommentDto,
  ) {
    return this.canvasService.createComment(pageId, req.user.userId, dto);
  }

  @Put('comments/:commentId/resolve')
  @ApiOperation({ summary: 'Resolve/unresolve a canvas comment' })
  @ApiResponse({ status: 200, description: 'Comment resolved' })
  async resolveComment(
    @Request() req: { user: { userId: string } },
    @Param('pageId') _pageId: string,
    @Param('commentId') commentId: string,
    @Body() dto: ResolveCanvasCommentDto,
  ) {
    return this.canvasService.resolveComment(commentId, req.user.userId, dto.resolved);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a canvas comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Request() req: { user: { userId: string } },
    @Param('pageId') _pageId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.canvasService.deleteComment(commentId, req.user.userId);
  }
}
