import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SrsRating } from '@vocabmaster/shared';

class OfflineReviewItemDto {
  @ApiProperty({ example: 'client-uuid-123' })
  @IsString()
  clientUuid: string;

  @ApiProperty({ example: 'word-uuid-456' })
  @IsString()
  wordId: string;

  @ApiProperty({ enum: [1, 2, 3, 4], example: 3 })
  @IsInt()
  @Min(1)
  @Max(4)
  rating: SrsRating;

  @ApiProperty({ example: '2026-11-14T07:45:00.000Z' })
  @IsString()
  reviewedAt: string;

  @ApiPropertyOptional({ example: 1400 })
  @IsOptional()
  @IsInt()
  responseTimeMs?: number;
}

export class SyncPushDto {
  @ApiPropertyOptional({ example: '2026-11-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  lastSyncTimestamp?: string;

  @ApiProperty({ type: [OfflineReviewItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineReviewItemDto)
  offlineReviews: OfflineReviewItemDto[];
}
