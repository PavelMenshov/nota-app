import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

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
