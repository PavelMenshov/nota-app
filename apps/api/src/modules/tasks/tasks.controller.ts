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
import { createTaskSchema, type CreateTaskInput } from '@nota/shared';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { UpdateTaskDto, AssigneeDto } from './dto/tasks.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body(ZodValidationPipe.with(createTaskSchema)) dto: CreateTaskInput,
  ) {
    return this.tasksService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async findAll(
    @Request() req: { user: { userId: string } },
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.tasksService.findAll(workspaceId, req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async findOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.tasksService.delete(id, req.user.userId);
  }

  @Post(':id/assignees')
  @ApiOperation({ summary: 'Add an assignee to task' })
  @ApiResponse({ status: 201, description: 'Assignee added' })
  async addAssignee(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: AssigneeDto,
  ) {
    return this.tasksService.addAssignee(id, req.user.userId, dto.userId);
  }

  @Delete(':id/assignees/:assigneeId')
  @ApiOperation({ summary: 'Remove an assignee from task' })
  @ApiResponse({ status: 200, description: 'Assignee removed' })
  async removeAssignee(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('assigneeId') assigneeId: string,
  ) {
    return this.tasksService.removeAssignee(id, req.user.userId, assigneeId);
  }
}
