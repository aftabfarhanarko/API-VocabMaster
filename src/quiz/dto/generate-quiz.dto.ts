import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizType, CefrLevel } from '@vocabmaster/shared';

export class GenerateQuizDto {
  @ApiProperty({
    enum: QuizType,
    example: QuizType.MULTIPLE_CHOICE,
    description: 'MULTIPLE_CHOICE | FILL_IN_BLANK | AUDIO_LISTENING | MATCHING_PAIRS',
  })
  @IsEnum(QuizType)
  quizType: QuizType;

  @ApiPropertyOptional({ default: 10, minimum: 5, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(30)
  questionCount?: number = 10;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ description: 'Filter quiz to a category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter quiz to a personal collection' })
  @IsOptional()
  @IsString()
  collectionId?: string;
}
