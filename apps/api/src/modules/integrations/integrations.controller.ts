import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateZoomMeetingDto, CreateOutlookEventDto } from './dto/integrations.dto';
import { ConfigService } from '@nestjs/config';

const FRONTEND_SUCCESS_PATH = '/dashboard/settings';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly config: ConfigService,
  ) {}

  private getFrontendBaseUrl(): string {
    return this.config.get<string>('CORS_ORIGIN')?.split(',')[0]?.trim() || 'http://localhost:3000';
  }

  @Get('zoom/authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zoom OAuth redirect URL' })
  @ApiResponse({ status: 200, description: 'Returns redirectUrl to send user to Zoom' })
  async zoomAuthorize(@Request() req: { user: { userId: string } }) {
    const redirectUrl = this.integrations.getZoomAuthorizeUrl(req.user.userId);
    return { redirectUrl };
  }

  @Get('zoom/callback')
  @ApiOperation({ summary: 'Zoom OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with success' })
  async zoomCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontend = this.getFrontendBaseUrl();
    if (error || !code || !state) {
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=error&message=${encodeURIComponent(error || 'missing_code')}`);
    }
    try {
      await this.integrations.handleZoomCallback(code, state);
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=success&provider=zoom`);
    } catch {
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=error&provider=zoom`);
    }
  }

  @Get('outlook/authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Microsoft/Outlook OAuth redirect URL' })
  @ApiResponse({ status: 200, description: 'Returns redirectUrl to send user to Microsoft' })
  async outlookAuthorize(@Request() req: { user: { userId: string } }) {
    const redirectUrl = this.integrations.getMicrosoftAuthorizeUrl(req.user.userId);
    return { redirectUrl };
  }

  @Get('outlook/callback')
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with success' })
  async outlookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontend = this.getFrontendBaseUrl();
    if (error || !code || !state) {
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=error&message=${encodeURIComponent(error || 'missing_code')}`);
    }
    try {
      await this.integrations.handleMicrosoftCallback(code, state);
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=success&provider=outlook`);
    } catch {
      return res.redirect(`${frontend}${FRONTEND_SUCCESS_PATH}?integrations=error&provider=outlook`);
    }
  }

  @Post('zoom/meetings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Returns join URL' })
  async createZoomMeeting(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateZoomMeetingDto,
  ) {
    return this.integrations.createZoomMeeting(
      req.user.userId,
      dto.title,
      dto.startTime,
      dto.endTime,
    );
  }

  @Post('outlook/events')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an event in Outlook calendar' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createOutlookEvent(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateOutlookEventDto,
  ) {
    return this.integrations.createOutlookEvent(
      req.user.userId,
      dto.title,
      dto.startTime,
      dto.endTime,
      dto.description,
    );
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected integrations' })
  @ApiResponse({ status: 200, description: 'Returns { zoom, outlook } booleans' })
  async status(@Request() req: { user: { userId: string } }) {
    return this.integrations.getConnectedIntegrations(req.user.userId);
  }
}
