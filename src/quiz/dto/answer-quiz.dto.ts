import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerQuizDto {
  @ApiProperty({ example: 'quiz-session-uuid' })
  @IsString()
  quizId: string;

  @ApiProperty({ example: 'q-1-quiz-session-uuid' })
  @IsString()
  questionId: string;

  @ApiProperty({ example: 'নির্ভরযোগ্য' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  userAnswer: string;
}
