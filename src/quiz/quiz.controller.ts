import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
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
  async generateQuiz(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateQuizDto) {
    return this.quizService.generateQuiz(dto, user.id);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit quiz responses, record session score and update activity' })
  async submitQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitQuizDto
  ) {
    return this.quizService.submitQuiz(user.id, dto);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Grade one answer server-side and return feedback after submission' })
  async answer(@CurrentUser() user: AuthenticatedUser, @Body() dto: AnswerQuizDto) {
    return this.quizService.answerQuiz(user.id, dto.quizId, dto.questionId, dto.userAnswer);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get past quiz session history' })
  async getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.quizService.getQuizHistory(user.id);
  }
}
