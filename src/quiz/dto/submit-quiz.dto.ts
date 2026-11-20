import {
  IsEnum,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizType } from '@vocabmaster/shared';

class QuizAnswerItemDto {
  @ApiProperty({ example: 'q-1' })
  @IsString()
  questionId: string;

  @ApiProperty({ example: 'word-uuid' })
  @IsOptional()
  @IsString()
  wordId?: string;

  @ApiProperty({ example: 'serendipity' })
  @IsString()
  userAnswer: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsInt()
  responseTimeMs?: number;
}

export class SubmitQuizDto {
  @ApiProperty({ example: 'quiz-session-uuid' })
  @IsString()
  quizId: string;

  @ApiProperty({ enum: QuizType, example: QuizType.MULTIPLE_CHOICE })
  @IsEnum(QuizType)
  quizType: QuizType;

  @ApiProperty({ example: 65, description: 'Total duration in seconds' })
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @ApiProperty({ type: [QuizAnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers: QuizAnswerItemDto[];
}
