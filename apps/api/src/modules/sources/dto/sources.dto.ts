import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsInt, IsPositive, IsEnum, IsObject } from 'class-validator';

export class CreateAnnotationDto {
  @ApiProperty({ enum: ['HIGHLIGHT', 'NOTE', 'DRAWING', 'TEXT'] })
  @IsEnum(['HIGHLIGHT', 'NOTE', 'DRAWING', 'TEXT'])
  type!: 'HIGHLIGHT' | 'NOTE' | 'DRAWING' | 'TEXT';

  @ApiPropertyOptional({ example: 'This is important!' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: '#ffff00' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  pageNumber!: number;

  @ApiProperty({ description: 'Position data as JSON (coordinates, bounds)', example: { x: 50, y: 30 } })
  @IsObject()
  position!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Selected text from PDF' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  selectedText?: string;
}

export class UpdateAnnotationDto {
  @ApiPropertyOptional({ example: 'Updated comment' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: '#ff0000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
