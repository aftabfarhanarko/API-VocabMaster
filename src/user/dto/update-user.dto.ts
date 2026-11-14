import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccentType } from '@vocabmaster/shared';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Farhan Aftab' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  dailyWordGoal?: number;

  @ApiPropertyOptional({ enum: AccentType, example: AccentType.US })
  @IsEnum(AccentType)
  @IsOptional()
  preferredAccent?: AccentType;

  @ApiPropertyOptional({ example: 'bn' })
  @IsString()
  @IsOptional()
  targetLanguage?: string;

  @ApiPropertyOptional({ example: 'dark', enum: ['light', 'dark', 'system'] })
  @IsString()
  @IsOptional()
  themePreference?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  soundEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  autoPlayAudio?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({ example: '21:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'reminderTime must be in 24-hour format HH:mm',
  })
  @IsOptional()
  reminderTime?: string;
}
