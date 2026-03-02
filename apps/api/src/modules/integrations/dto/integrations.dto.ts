import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateZoomMeetingDto {
  @ApiProperty({ example: 'Team sync' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: '2024-12-01T10:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2024-12-01T11:00:00Z' })
  @IsDateString()
  endTime!: string;
}

export class CreateOutlookEventDto {
  @ApiProperty({ example: 'Team sync' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: '2024-12-01T10:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2024-12-01T11:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ example: 'Weekly sync agenda' })
  @IsOptional()
  @IsString()
  description?: string;
}
