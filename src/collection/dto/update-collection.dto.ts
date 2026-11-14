import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollectionDto {
  @ApiPropertyOptional({ example: 'Updated Collection Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'folder' })
  @IsOptional()
  @IsString()
  icon?: string;
}
