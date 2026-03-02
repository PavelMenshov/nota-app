import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LmsService } from './lms.service';
import { CreateLmsIntegrationDto, SyncLmsAssignmentsDto } from './dto/lms.dto';

@ApiTags('lms')
@Controller('lms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LmsController {
  constructor(private lmsService: LmsService) {}

  @Get('integrations')
  @ApiOperation({ summary: "List current user's LMS integrations" })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async listIntegrations(@Request() req: { user: { userId: string } }) {
    return this.lmsService.listIntegrations(req.user.userId);
  }

  @Post('integrations')
  @ApiOperation({ summary: 'Create an LMS integration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  async createIntegration(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateLmsIntegrationDto,
  ) {
    return this.lmsService.createIntegration(req.user.userId, dto);
  }

  @Get('integrations/:id/courses')
  @ApiOperation({ summary: 'Sync and return courses for an integration (demo: mock if none)' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async getCourses(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.lmsService.getCourses(id, req.user.userId);
  }

  @Get('integrations/:id/courses-with-assignments')
  @ApiOperation({ summary: 'Get courses with assignments for import/sync' })
  @ApiResponse({ status: 200, description: 'Courses with assignments (for Sync from LMS)' })
  async getCoursesWithAssignments(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.lmsService.getCoursesWithAssignments(id, req.user.userId);
  }

  @Post('integrations/:id/sync')
  @ApiOperation({ summary: 'Sync selected assignments into a workspace as tasks' })
  @ApiResponse({ status: 201, description: 'Tasks created from LMS assignments' })
  async syncAssignments(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: SyncLmsAssignmentsDto,
  ) {
    return this.lmsService.syncAssignmentsToWorkspace(
      id,
      req.user.userId,
      dto.workspaceId,
      dto.assignmentIds,
    );
  }

  @Get('integrations/:id/grades')
  @ApiOperation({ summary: 'Get grades (from DB); sync first via POST sync-grades' })
  @ApiResponse({ status: 200, description: 'Grades grouped by course' })
  async getGrades(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.lmsService.getGrades(id, req.user.userId);
  }

  @Post('integrations/:id/sync-grades')
  @ApiOperation({ summary: 'Sync grades from Blackboard into DB' })
  @ApiResponse({ status: 200, description: 'Number of grade columns synced' })
  async syncGrades(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.lmsService.syncGrades(id, req.user.userId);
  }

  @Get('integrations/:id/announcements')
  @ApiOperation({ summary: 'Get announcements (from DB); sync first via POST sync-announcements' })
  @ApiResponse({ status: 200, description: 'List of announcements' })
  async getAnnouncements(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.lmsService.getAnnouncements(id, req.user.userId, limit ? parseInt(limit, 10) : 50);
  }

  @Post('integrations/:id/sync-announcements')
  @ApiOperation({ summary: 'Sync announcements from Blackboard into DB' })
  @ApiResponse({ status: 200, description: 'Number of announcements synced' })
  async syncAnnouncements(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.lmsService.syncAnnouncements(id, req.user.userId);
  }
}
