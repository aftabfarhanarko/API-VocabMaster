import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Interactive Quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate dynamic quiz session questions based on type and filters' })
  async generateQuiz(@Body() dto: GenerateQuizDto) {
    return this.quizService.generateQuiz(dto);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit quiz responses, record session score and update activity' })
  async submitQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitQuizDto
  ) {
    return this.quizService.submitQuiz(user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past quiz session history' })
  async getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.quizService.getQuizHistory(user.id);
  }
}
