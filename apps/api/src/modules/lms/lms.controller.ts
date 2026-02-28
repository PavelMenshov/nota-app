import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LmsService } from './lms.service';
import { CreateLmsIntegrationDto } from './dto/lms.dto';

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
}
