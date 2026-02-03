import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsDateString, IsBoolean } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'cuid123' })
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional({ example: 'cuid456' })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiProperty({ example: 'Team Meeting' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Weekly sync meeting' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '2024-12-01T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-12-01T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ example: 'Room 101' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Updated Meeting Title' })
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

  @ApiPropertyOptional({ example: '2024-12-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2024-12-01T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ example: 'Room 102' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: '#ef4444' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ example: 'cuid789' })
  @IsOptional()
  @IsString()
  pageId?: string;
}
