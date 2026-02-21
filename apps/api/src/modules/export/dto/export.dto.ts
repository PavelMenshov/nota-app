import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsArray, IsString, IsBoolean, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class ExportConfigDto {
  @ApiPropertyOptional({ example: ['cuid123', 'cuid456'], description: 'Page IDs to export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pageIds?: string[];

  @ApiPropertyOptional({ example: 'cuid789', description: 'Workspace ID to export all pages' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: true, description: 'Include PDF annotations' })
  @IsOptional()
  @IsBoolean()
  includeAnnotations?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Include cover images' })
  @IsOptional()
  @IsBoolean()
  includeCoverImage?: boolean;
}

export class CreateExportJobDto {
  @ApiProperty({ enum: ['PDF', 'DOCX', 'MARKDOWN'], description: 'Export format' })
  @IsEnum(['PDF', 'DOCX', 'MARKDOWN'])
  type!: 'PDF' | 'DOCX' | 'MARKDOWN';

  @ApiProperty({ description: 'Export configuration' })
  @ValidateNested()
  @Type(() => ExportConfigDto)
  config!: ExportConfigDto;
}

export class SendToNotionDto {
  @ApiProperty({ description: 'Page ID to send to Notion' })
  @IsString()
  @IsNotEmpty()
  pageId!: string;

  @ApiProperty({ description: 'Notion integration token' })
  @IsString()
  @IsNotEmpty()
  notionToken!: string;

  @ApiPropertyOptional({ description: 'Notion parent page ID (creates under this page)' })
  @IsOptional()
  @IsString()
  parentPageId?: string;
}
