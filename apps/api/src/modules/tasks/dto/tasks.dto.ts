import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsEnum, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'cuid123' })
  @IsString()
  workspaceId!: string;

  @ApiPropertyOptional({ example: 'cuid456' })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiProperty({ example: 'Complete assignment' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Description of the task' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Updated task title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'cuid789' })
  @IsOptional()
  @IsString()
  pageId?: string;
}

export class AssigneeDto {
  @ApiProperty({ example: 'cuid123' })
  @IsString()
  userId!: string;
}
