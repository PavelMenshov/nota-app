import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { quickLinksSchema, localeSchema, type QuickLinksPreferences, type LocalePreference } from './dto/settings.dto';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('quick-links')
  @ApiOperation({ summary: 'Get library and classroom quick-link preferences' })
  @ApiResponse({ status: 200, description: 'Current quick-links (library, classroom)' })
  async getQuickLinks(@Request() req: { user: { userId: string } }) {
    return this.settingsService.getQuickLinks(req.user.userId);
  }

  @Patch('quick-links')
  @ApiOperation({ summary: 'Update library and classroom quick-link preferences' })
  @ApiResponse({ status: 200, description: 'Updated quick-links' })
  async updateQuickLinks(
    @Request() req: { user: { userId: string } },
    @Body(ZodValidationPipe.with(quickLinksSchema)) body: QuickLinksPreferences,
  ) {
    return this.settingsService.updateQuickLinks(req.user.userId, body);
  }

  @Get('locale')
  @ApiOperation({ summary: 'Get language preference' })
  @ApiResponse({ status: 200, description: 'Current locale (en, ru, zh)' })
  async getLocale(@Request() req: { user: { userId: string } }) {
    return this.settingsService.getLocale(req.user.userId);
  }

  @Patch('locale')
  @ApiOperation({ summary: 'Update language preference' })
  @ApiResponse({ status: 200, description: 'Updated locale' })
  async updateLocale(
    @Request() req: { user: { userId: string } },
    @Body(ZodValidationPipe.with(localeSchema)) body: LocalePreference,
  ) {
    return this.settingsService.updateLocale(req.user.userId, body.locale);
  }
}
