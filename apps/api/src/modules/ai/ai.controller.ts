import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SummaryDto, FlashcardsDto, ExplainDto } from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('summary')
  @ApiOperation({ summary: 'Generate AI summary of page content' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  async generateSummary(
    @Request() req: { user: { userId: string } },
    @Body() dto: SummaryDto,
  ) {
    return this.aiService.generateSummary(req.user.userId, dto);
  }

  @Post('flashcards')
  @ApiOperation({ summary: 'Generate AI flashcards from page content' })
  @ApiResponse({ status: 200, description: 'Flashcards generated' })
  async generateFlashcards(
    @Request() req: { user: { userId: string } },
    @Body() dto: FlashcardsDto,
  ) {
    return this.aiService.generateFlashcards(req.user.userId, dto);
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain selected text using AI' })
  @ApiResponse({ status: 200, description: 'Explanation generated' })
  async explainText(
    @Request() req: { user: { userId: string } },
    @Body() dto: ExplainDto,
  ) {
    return this.aiService.explainText(req.user.userId, dto);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsage(@Request() req: { user: { userId: string } }) {
    return this.aiService.getUsage(req.user.userId);
  }

  @Get('flashcards')
  @ApiOperation({ summary: 'Get all flashcard sets' })
  @ApiResponse({ status: 200, description: 'List of flashcard sets' })
  async getFlashcardSets(@Request() req: { user: { userId: string } }) {
    return this.aiService.getFlashcardSets(req.user.userId);
  }

  @Delete('flashcards/:id')
  @ApiOperation({ summary: 'Delete a flashcard set' })
  @ApiResponse({ status: 200, description: 'Flashcard set deleted' })
  async deleteFlashcardSet(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.aiService.deleteFlashcardSet(req.user.userId, id);
  }
}
