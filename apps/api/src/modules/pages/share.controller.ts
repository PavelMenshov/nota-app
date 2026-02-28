import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PagesService } from './pages.service';

/** Public share link endpoint — no auth required. */
@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private pagesService: PagesService) {}

  @Get('page/:shareLink')
  @ApiOperation({ summary: 'Get page by share link (public, read-only)' })
  @ApiResponse({ status: 200, description: 'Page data for viewing' })
  @ApiResponse({ status: 404, description: 'Invalid or expired link' })
  async getPageByShareLink(@Param('shareLink') shareLink: string) {
    return this.pagesService.getByShareLink(shareLink);
  }
}
