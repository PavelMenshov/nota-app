import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateDocDto {
  @ApiProperty({ description: 'Document content as JSON' })
  content: unknown;

  @ApiPropertyOptional({ description: 'Plain text for search indexing' })
  @IsOptional()
  @IsString()
  plainText?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great point here!' })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Position in document (JSON)' })
  @IsOptional()
  position?: unknown;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ResolveCommentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  resolved: boolean;
}
