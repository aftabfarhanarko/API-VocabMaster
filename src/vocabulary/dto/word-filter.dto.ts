import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, PartOfSpeech, SrsState } from '@vocabmaster/shared';

export class WordFilterDto {
  @ApiPropertyOptional({ description: 'Search term for word or meaning' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CefrLevel, description: 'CEFR level (A1-C2)' })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ description: 'Vocabulary category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: PartOfSpeech, description: 'Part of speech' })
  @IsOptional()
  @IsEnum(PartOfSpeech)
  partOfSpeech?: PartOfSpeech;

  @ApiPropertyOptional({ enum: SrsState, description: 'SRS learning state' })
  @IsOptional()
  @IsEnum(SrsState)
  srsState?: SrsState;

  @ApiPropertyOptional({ description: 'Filter by personal collection ID' })
  @IsOptional()
  @IsString()
  collectionId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: ['word', 'frequencyScore', 'createdAt'], default: 'frequencyScore' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'frequencyScore';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    enum: ['database', 'freedict'],
    default: 'database',
    description: 'Data source (Neon PostgreSQL database or FreeDict live API)',
  })
  @IsOptional()
  @IsString()
  source?: 'database' | 'freedict' = 'database';
}
