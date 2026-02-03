import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SummaryDto, FlashcardsDto } from './dto/ai.dto';

// AI Configuration - Add your API keys here
// TODO: Register at https://openai.com/api/ or https://console.anthropic.com/
// Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local

@Injectable()
export class AIService {
  private readonly aiProvider: string;
  private readonly apiKey: string | undefined;
  private readonly dailyLimit: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.aiProvider = this.configService.get('AI_PROVIDER') || 'openai';
    this.apiKey = this.configService.get('OPENAI_API_KEY') || this.configService.get('ANTHROPIC_API_KEY');
    this.dailyLimit = parseInt(this.configService.get('AI_DAILY_LIMIT') || '50', 10);
  }

  async generateSummary(userId: string, dto: SummaryDto) {
    await this.checkUsageLimit(userId);

    // Get page content
    const page = await this.getPageWithContent(dto.pageId, userId);

    // Collect content from doc and sources
    let contentToSummarize = '';

    if (dto.includeDoc !== false && page.doc?.plainText) {
      contentToSummarize += `Document Content:\n${page.doc.plainText}\n\n`;
    }

    if (dto.includeSources !== false) {
      for (const source of page.sources) {
        if (source.extractedText) {
          contentToSummarize += `Source (${source.fileName}):\n${source.extractedText}\n\n`;
        }
        
        // Include highlights
        const highlights = await this.prisma.pDFAnnotation.findMany({
          where: {
            sourceId: source.id,
            type: 'HIGHLIGHT',
            selectedText: { not: null },
          },
        });

        if (highlights.length > 0) {
          contentToSummarize += `Highlights from ${source.fileName}:\n`;
          highlights.forEach((h) => {
            contentToSummarize += `- ${h.selectedText}\n`;
          });
          contentToSummarize += '\n';
        }
      }
    }

    if (!contentToSummarize.trim()) {
      throw new BadRequestException('No content available to summarize');
    }

    // Generate summary using AI
    const summary = await this.callAI(
      `Please provide a comprehensive but concise summary of the following content. Focus on key concepts, main ideas, and important details. The summary should be helpful for studying and review.\n\n${contentToSummarize}`,
      dto.maxLength || 1000,
    );

    // Record usage
    await this.recordUsage(userId, 'SUMMARY', summary.tokensUsed);

    return {
      summary: summary.text,
      tokensUsed: summary.tokensUsed,
      pageTitle: page.title,
    };
  }

  async generateFlashcards(userId: string, dto: FlashcardsDto) {
    await this.checkUsageLimit(userId);

    // Get page content
    const page = await this.getPageWithContent(dto.pageId, userId);

    let contentForFlashcards = '';

    if (page.doc?.plainText) {
      contentForFlashcards += page.doc.plainText + '\n\n';
    }

    for (const source of page.sources) {
      if (source.extractedText) {
        contentForFlashcards += source.extractedText.substring(0, 5000) + '\n\n';
      }
    }

    if (!contentForFlashcards.trim()) {
      throw new BadRequestException('No content available to create flashcards');
    }

    const count = Math.min(dto.count || 10, 50);
    
    // Generate flashcards using AI
    const result = await this.callAI(
      `Based on the following content, create ${count} flashcards for studying. Return them as a JSON array where each object has "front" (question) and "back" (answer) properties. Make the questions clear and the answers concise but complete.\n\nContent:\n${contentForFlashcards.substring(0, 8000)}`,
      4000,
    );

    // Parse flashcards from AI response
    let flashcards: Array<{ front: string; back: string }> = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, create a simple flashcard with the response
      flashcards = [{ front: 'What are the key points?', back: result.text }];
    }

    // Create flashcard set
    const flashcardSet = await this.prisma.flashcardSet.create({
      data: {
        userId,
        title: dto.title || `Flashcards from ${page.title}`,
        cards: {
          create: flashcards.map((fc) => ({
            front: fc.front,
            back: fc.back,
          })),
        },
      },
      include: {
        cards: true,
      },
    });

    // Record usage
    await this.recordUsage(userId, 'FLASHCARDS', result.tokensUsed);

    return {
      flashcardSet,
      tokensUsed: result.tokensUsed,
    };
  }

  async getUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
      },
      _sum: { tokens: true },
      _count: true,
    });

    const totalUsage = await this.prisma.aIUsage.aggregate({
      where: { userId },
      _sum: { tokens: true },
      _count: true,
    });

    return {
      today: {
        requests: usage._count,
        tokens: usage._sum.tokens || 0,
        limit: this.dailyLimit,
        remaining: Math.max(0, this.dailyLimit - usage._count),
      },
      total: {
        requests: totalUsage._count,
        tokens: totalUsage._sum.tokens || 0,
      },
    };
  }

  async getFlashcardSets(userId: string) {
    return this.prisma.flashcardSet.findMany({
      where: { userId },
      include: {
        cards: true,
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFlashcardSet(userId: string, setId: string) {
    const set = await this.prisma.flashcardSet.findUnique({
      where: { id: setId },
    });

    if (!set || set.userId !== userId) {
      throw new NotFoundException('Flashcard set not found');
    }

    await this.prisma.flashcardSet.delete({
      where: { id: setId },
    });

    return { success: true };
  }

  private async checkUsageLimit(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIUsage.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (usage >= this.dailyLimit) {
      throw new ForbiddenException(`Daily AI usage limit (${this.dailyLimit} requests) exceeded. Try again tomorrow.`);
    }
  }

  private async recordUsage(userId: string, type: 'SUMMARY' | 'FLASHCARDS' | 'CHAT' | 'OTHER', tokens: number) {
    await this.prisma.aIUsage.create({
      data: {
        userId,
        type,
        tokens,
      },
    });
  }

  private async getPageWithContent(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: { members: true },
        },
        doc: true,
        sources: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const hasAccess = page.workspace.members.some((m) => m.userId === userId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied');
    }

    return page;
  }

  private async callAI(prompt: string, maxTokens: number): Promise<{ text: string; tokensUsed: number }> {
    // Check if API key is configured
    if (!this.apiKey) {
      // Return mock response for demo
      console.warn('AI API key not configured. Returning mock response.');
      return {
        text: `[AI Response Placeholder]\n\nTo enable real AI features, please configure your API key:\n\n1. For OpenAI: Set OPENAI_API_KEY in .env.local\n2. For Anthropic: Set ANTHROPIC_API_KEY in .env.local\n\nOnce configured, this will provide real AI-generated summaries and flashcards based on your content.`,
        tokensUsed: 100,
      };
    }

    // TODO: Implement actual AI API calls
    // For OpenAI:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }],
    //     max_tokens: maxTokens,
    //   }),
    // });

    // For Anthropic:
    // const response = await fetch('https://api.anthropic.com/v1/messages', { ... });

    return {
      text: `[AI Response - API Key Configured but not implemented]\n\nPrompt received: ${prompt.substring(0, 100)}...`,
      tokensUsed: Math.ceil(prompt.length / 4),
    };
  }
}
