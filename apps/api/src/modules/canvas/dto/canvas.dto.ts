import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCanvasDto {
  @ApiProperty({ description: 'Canvas content as JSON (elements, viewport, etc.)' })
  content: unknown;
}

export class ConvertToOutlineDto {
  @ApiPropertyOptional({ description: 'Array of element IDs to convert. If empty, converts all text elements.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  elementIds?: string[];
}

export class CreateCanvasCommentDto {
  @ApiProperty({ description: 'Comment text' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Position on canvas (JSON)' })
  @IsOptional()
  position?: unknown;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ResolveCanvasCommentDto {
  @ApiProperty({ description: 'Resolved state' })
  @IsBoolean()
  resolved!: boolean;
}
