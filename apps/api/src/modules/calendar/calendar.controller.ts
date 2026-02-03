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
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post()
  @ApiOperation({ summary: 'Create a calendar event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateEventDto,
  ) {
    return this.calendarService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'List of events' })
  async findAll(
    @Request() req: { user: { userId: string } },
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.calendarService.findAll(workspaceId, req.user.userId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async findOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.calendarService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendarService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.calendarService.delete(id, req.user.userId);
  }
}
