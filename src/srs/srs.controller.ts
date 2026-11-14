import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SrsService } from './srs.service';
import { ReviewCardDto } from './dto/review-card.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Spaced Repetition System (SRS)')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('srs')
export class SrsController {
  constructor(private readonly srsService: SrsService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get current due flashcards and new words queue for daily study' })
  async getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.srsService.getReviewQueue(user.id);
  }

  @Post('review')
  @ApiOperation({ summary: 'Submit flashcard review rating (Again, Hard, Good, Easy) using SM-2' })
  async submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewCardDto
  ) {
    return this.srsService.submitReview(user.id, dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get overall SRS retention metrics and learning state distribution' })
  async getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.srsService.getSummary(user.id);
  }
}
