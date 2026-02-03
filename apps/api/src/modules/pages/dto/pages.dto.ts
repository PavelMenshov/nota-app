import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsEnum } from 'class-validator';

export class CreatePageDto {
  @ApiProperty({ example: 'cuid123' })
  @IsString()
  workspaceId: string;

  @ApiProperty({ example: 'My New Page' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'cuid456' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdatePageDto {
  @ApiPropertyOptional({ example: 'Updated Page Title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '📝' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'cuid789' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class GeneratePageShareLinkDto {
  @ApiPropertyOptional({ enum: ['EDITOR', 'VIEWER'], default: 'VIEWER' })
  @IsOptional()
  @IsEnum(['EDITOR', 'VIEWER'])
  role?: 'EDITOR' | 'VIEWER';
}
