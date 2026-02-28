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
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@nota/shared';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { UpdateWorkspaceDto, AddMemberDto, UpdateMemberRoleDto, GenerateShareLinkDto, LinkWorkspaceLmsDto } from './dto/workspaces.dto';

@ApiTags('workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body(ZodValidationPipe.with(createWorkspaceSchema)) dto: CreateWorkspaceInput,
  ) {
    return this.workspacesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async findAll(@Request() req: { user: { userId: string } }) {
    return this.workspacesService.findAll(req.user.userId);
  }

  @Post('demo')
  @ApiOperation({ summary: 'Create a demo workspace for pitch (Blackboard-style)' })
  @ApiResponse({ status: 201, description: 'Demo workspace created' })
  async createDemo(@Request() req: { user: { userId: string } }) {
    return this.workspacesService.createDemo(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.workspacesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted' })
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.workspacesService.delete(id, req.user.userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to workspace' })
  @ApiResponse({ status: 201, description: 'Member added' })
  async addMember(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspacesService.addMember(id, req.user.userId, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from workspace' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(id, memberId, req.user.userId);
  }

  @Put(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, req.user.userId, dto.role);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate share link for workspace' })
  @ApiResponse({ status: 200, description: 'Share link generated' })
  async generateShareLink(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: GenerateShareLinkDto,
  ) {
    return this.workspacesService.generateShareLink(id, req.user.userId, dto.role);
  }

  @Post(':id/lms')
  @ApiOperation({ summary: 'Link workspace to an LMS integration' })
  @ApiResponse({ status: 200, description: 'Workspace linked to LMS' })
  async linkLms(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: LinkWorkspaceLmsDto,
  ) {
    return this.workspacesService.linkLms(id, req.user.userId, dto.integrationId);
  }

  @Post('join/:shareLink')
  @ApiOperation({ summary: 'Join workspace by share link' })
  @ApiResponse({ status: 200, description: 'Joined workspace' })
  async joinByShareLink(
    @Request() req: { user: { userId: string } },
    @Param('shareLink') shareLink: string,
  ) {
    return this.workspacesService.joinByShareLink(shareLink, req.user.userId);
  }
}
