import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SrsRating } from '@vocabmaster/shared';

export class ReviewCardDto {
  @ApiProperty({ description: 'Vocabulary word UUID or ID', example: 'word-uuid-123' })
  @IsString()
  @IsNotEmpty()
  wordId: string;

  @ApiProperty({
    enum: [1, 2, 3, 4],
    description: '1=Again, 2=Hard, 3=Good, 4=Easy',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  rating: SrsRating;

  @ApiPropertyOptional({ description: 'Response time in milliseconds', example: 1850 })
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTimeMs?: number;
}
