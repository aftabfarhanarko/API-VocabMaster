import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ example: 'IELTS Writing Task 2 Essentials' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'High-scoring academic vocabulary for IELTS essays' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#4F46E5' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'bookmark' })
  @IsOptional()
  @IsString()
  icon?: string;
}
