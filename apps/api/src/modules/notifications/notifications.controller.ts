import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user (unread first)' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async findAll(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.findAll(req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async markRead(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(id, req.user.userId);
  }
}
