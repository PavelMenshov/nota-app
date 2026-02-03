import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MaxLength } from 'class-validator';

export class SummaryDto {
  @ApiProperty({ example: 'cuid123', description: 'Page ID to summarize' })
  @IsString()
  pageId: string;

  @ApiPropertyOptional({ example: true, description: 'Include document content' })
  @IsOptional()
  @IsBoolean()
  includeDoc?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Include sources (PDFs) content' })
  @IsOptional()
  @IsBoolean()
  includeSources?: boolean;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum summary length' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  maxLength?: number;
}

export class FlashcardsDto {
  @ApiProperty({ example: 'cuid123', description: 'Page ID to create flashcards from' })
  @IsString()
  pageId: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of flashcards to generate' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;

  @ApiPropertyOptional({ example: 'Chapter 1 Flashcards', description: 'Title for the flashcard set' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}
